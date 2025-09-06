import axios, { AxiosResponse } from "axios";
import { BadRequestError } from "../errors/bad-request.error";
import { InternalServerError } from "../errors/internal-server.error";
import { IOrder } from "../models/order.model";

const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

interface IPackageDetails {
    weight: number;
    length: number;
    breadth: number;
    height: number;
}

interface IShiprocketOrderItem {
    name: String;
    sku: string;
    units: number;
    selling_price: string;
    discount: number;
    tax: number;
    hsn: string;
}

interface IShiprocketPayload {
    order_id: string;
    order_date: string;
    pickup_location: string;
    channel_id: string;
    billing_customer_name: string;
    billing_last_name: string;
    billing_address: string;
    billing_address_2: string;
    billing_city: string;
    billing_pincode: string;
    billing_state: string;
    billing_country: string;
    billing_email: string;
    billing_phone: string;
    shipping_is_billing: boolean;
    order_items: IShiprocketOrderItem[];
    payment_method: string;
    sub_total: string;
    length: number;
    breadth: number;
    height: number;
    weight: number;
}

interface IShiprocketResponse {
    order_id: number;
    shipment_id: number;
    status: string;
    status_code: number;
    onboarding_completed_now: number;
    awb_code: string;
    courier_company_id: number;
    courier_name: string;
}

class ShiprocketService {
    private token: string | null = null;

    private calculatePackageDetails(orderItems: any[]): IPackageDetails {
        let totalWeight = 0;
        const maxDimensions = { l: 0, b: 0, h: 0 };

        orderItems.forEach(item => {
            const weightKg = item.product.weight.unit === 'g'
                ? item.product.weight.number / 1000
                : item.product.weight.number;

            totalWeight += weightKg * item.quantity;

            maxDimensions.l = Math.max(maxDimensions.l, item.product.dimensions.l);
            maxDimensions.b = Math.max(maxDimensions.b, item.product.dimensions.b);
            maxDimensions.h = Math.max(maxDimensions.h, item.product.dimensions.h);
        });

        return {
            weight: Math.max(totalWeight, 0.1), 
            length: Math.max(maxDimensions.l, 10), 
            breadth: Math.max(maxDimensions.b, 10),
            height: Math.max(maxDimensions.h, 5)
        }
    }

    private async authenticate(): Promise<void> {
        try {
            const response: AxiosResponse = await axios.post(`${SHIPROCKET_BASE_URL}/auth/login`, {
                email: process.env.SHIPROCKET_EMAIL,
                password: process.env.SHIPROCKET_PASSWORD
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!response.data?.token) {
                throw new InternalServerError('No token received from Shiprocket');
            }

            this.token = response.data.token;
        } catch (error: any) {
            console.error('Shiprocket authentication error:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            throw new BadRequestError(`Shiprocket authentication failed: ${error.response?.data?.message || error.message}`);
        }
    }

    async createShipment(order: IOrder, userEmail?: string): Promise<IShiprocketResponse> {
    if (!this.token) {
        await this.authenticate();
    }

    try {
        const orderItems: IShiprocketOrderItem[] = order.items.map(item => ({
            name: item.productName,
            sku: item.productCode,
            units: item.quantity,
            selling_price: item.priceAtPurchase.toFixed(2),
            discount: 0,
            tax: 0,
            hsn: ""
        }));

        const packageDetails: IPackageDetails = {
            weight: 1.0,
            length: 20,
            breadth: 15,
            height: 10
        };

        const payload = {
            order_id: order.orderNumber,
            order_date: order.createdAt.toISOString(),
            pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || 'Default',
            channel_id: '',
            billing_customer_name: order.shippingAddress.name,
            billing_last_name: order.shippingAddress.name.split(' ').pop() || 'Customer',
            billing_address: order.shippingAddress.addressLine1,
            billing_address_2: order.shippingAddress.addressLine2 || '',
            billing_city: order.shippingAddress.city,
            billing_pincode: order.shippingAddress.pinCode,
            billing_state: order.shippingAddress.state,
            billing_country: order.shippingAddress.country,
            billing_email: userEmail || 'customer@example.com',
            billing_phone: order.shippingAddress.phone,
            shipping_is_billing: true,
            order_items: orderItems,
            payment_method: order.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
            sub_total: order.total.toFixed(2),
            length: packageDetails.length,
            breadth: packageDetails.breadth,
            height: packageDetails.height,
            weight: packageDetails.weight
        };

        console.log('Shiprocket payload:', JSON.stringify(payload, null, 2));

        const response: AxiosResponse = await axios.post(
            `${SHIPROCKET_BASE_URL}/orders/create/adhoc`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // ✅ DETAILED RESPONSE LOGGING
        console.log('=== SHIPROCKET API RESPONSE ===');
        console.log('Status:', response.status);
        console.log('Full Response:', JSON.stringify(response.data, null, 2));
        console.log('===============================');

        // ✅ HANDLE DIFFERENT RESPONSE STRUCTURES
        const responseData = response.data;
        
        // Check if response indicates success
        if (responseData.success === false) {
            throw new BadRequestError(`Shiprocket API Error: ${responseData.message}`);
        }

        // Extract data from appropriate structure
        const shipmentData = responseData.data || responseData;
        
        const result: IShiprocketResponse = {
            order_id: shipmentData.order_id || 0,
            shipment_id: shipmentData.shipment_id || 0,
            status: shipmentData.status || 'UNKNOWN',
            status_code: shipmentData.status_code || 0,
            onboarding_completed_now: shipmentData.onboarding_completed_now || 0,
            awb_code: shipmentData.awb_code || '', // May be null initially
            courier_company_id: shipmentData.courier_company_id || 0,
            courier_name: shipmentData.courier_name || ''
        };

        console.log('Parsed result:', result);
        return result;

    } catch (error: any) {
        console.error('Shiprocket shipment creation error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
        });

        if (error.response?.status === 401) {
            this.token = null;
            await this.authenticate();
            return this.createShipment(order, userEmail);
        }

        throw new BadRequestError(
            `Shiprocket shipment creation failed: ${error.response?.data?.message || error.message}`
        );
    }
}


    async trackShipment(awbCode: string): Promise <any> {
        if(!this.token) {
            await this.authenticate();
        }

        try {
            const response: AxiosResponse = await axios.get(
                `${SHIPROCKET_BASE_URL}/courier/track/awb/${awbCode}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                }
            )

            return response.data;
        } catch (error: any) {
            throw new BadRequestError(`Tracking failed: $${error.response?.data?.message || error.message}`);
        }
    }

    async cancelShipment(awbCodes: string []): Promise<any> {
        if(!this.token) {
            await this.authenticate();
        }

        try {
            const response: AxiosResponse = await axios.post(
                `${SHIPROCKET_BASE_URL}/orders/cancel/shipment/awbs`,
                { awbs: awbCodes },
                {
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                }
            )

            return response.data;
        } catch (error :any) {
            throw new BadRequestError(`Shipment cancellation failed: ${error.response?.data?.message || error.message}`);
        }
    }
}

export default new ShiprocketService();