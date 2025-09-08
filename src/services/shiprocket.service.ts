import axios, { AxiosResponse } from "axios";
import { BadRequestError } from "../errors/bad-request.error";
import { InternalServerError } from "../errors/internal-server.error";
import { IOrder } from "../models/order.model";
import productService from "./product.service";
import categoryService from "./category.service";

const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

interface IPackageDetails {
    weight: number;
    length: number;
    breadth: number;
    height: number;
}

interface IShiprocketOrderItem {
    name: string;
    sku: string;
    units: number;
    selling_price: string;
    discount: number;
    tax: number;
    hsn: string;
}

class ShiprocketService {
    private token: string | null = null;

    private async calculatePackageDetails(orderItems: any[]): Promise<IPackageDetails> {
        let totalWeight = 0;
        const maxDimensions = { l: 0, b: 0, h: 0 };

        for (const item of orderItems) {
            try {
                const product = await productService.getProductById(item.product.toString());
                
                if (product) {
                    const weightKg = product.weight.unit === 'g'
                        ? product.weight.number / 1000
                        : product.weight.number;

                    totalWeight += weightKg * item.quantity;

                    maxDimensions.l = Math.max(maxDimensions.l, product.dimensions.l);
                    maxDimensions.b = Math.max(maxDimensions.b, product.dimensions.b);
                    maxDimensions.h = Math.max(maxDimensions.h, product.dimensions.h);
                }
            } catch (error) {
                console.error(`Error fetching product ${item.product}:`, error);
            }
        }

        return {
            weight: Math.max(totalWeight, 0.1), 
            length: Math.max(maxDimensions.l, 10), 
            breadth: Math.max(maxDimensions.b, 10),
            height: Math.max(maxDimensions.h, 5)
        };
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
            throw new BadRequestError(`Shiprocket authentication failed: ${error.response?.data?.message || error.message}`);
        }
    }

    async createShipment(order: IOrder, userEmail?: string): Promise<any> {
        if (!this.token) {
            await this.authenticate();
        }

        try {

            const orderItems: IShiprocketOrderItem[] = [];

            for (const item of order.items) {
                // Fetch product manually
                const product = await productService.getProductById(item.product.toString());
                
                let hsn = "";
                if (product && product.category) {
                    // ✅ Manual fetch of category to get HSN
                    const category = await categoryService.getCategoryById(product.category.toString());
                    hsn = category?.hsn || "";
                }

                orderItems.push({
                    name: item.productName,
                    sku: item.productCode,
                    units: item.quantity,
                    selling_price: item.priceAtPurchase.toFixed(2),
                    discount: 0,
                    tax: 0,
                    hsn: hsn // ✅ HSN from manually fetched category
                });
            }

            // ✅ FIXED: Calculate actual package details from products
            const packageDetails = await this.calculatePackageDetails(order.items);

            // ✅ FIXED: Ensure state is properly formatted
            const formattedState = this.formatStateName(order.shippingAddress.state);

            // ✅ FIXED: Ensure phone number is available
            const customerPhone = order.shippingAddress.phone || '0000000000';

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
                billing_state: formattedState, // ✅ Properly formatted state
                billing_country: order.shippingAddress.country || "India",
                billing_email: userEmail || 'customer@example.com',
                billing_phone: customerPhone, // ✅ Ensure phone is always present
                shipping_is_billing: true,
                order_items: orderItems,
                payment_method: order.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
                sub_total: order.total.toFixed(2),
                length: packageDetails.length,    // ✅ Real dimensions
                breadth: packageDetails.breadth,  // ✅ Real dimensions
                height: packageDetails.height,    // ✅ Real dimensions
                weight: packageDetails.weight     // ✅ Real weight
            };

            // ✅ ENHANCED LOGGING for debugging
            console.log('=== SHIPROCKET PAYLOAD DEBUG ===');
            console.log('Customer Phone:', customerPhone);
            console.log('State:', formattedState);
            console.log('Package Details:', packageDetails);
            console.log('Full Payload:', JSON.stringify(payload, null, 2));
            console.log('================================');

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

            console.log('=== SHIPROCKET API RESPONSE ===');
            console.log('Status:', response.status);
            console.log('Full Response:', JSON.stringify(response.data, null, 2));
            console.log('===============================');

            const responseData = response.data;
            
            if (responseData.success === false) {
                throw new BadRequestError(`Shiprocket API Error: ${responseData.message}`);
            }

            const shipmentData = responseData.data || responseData;
            
            const result = {
                order_id: shipmentData.order_id || 0,
                shipment_id: shipmentData.shipment_id || 0,
                status: shipmentData.status || 'UNKNOWN',
                status_code: shipmentData.status_code || 0,
                onboarding_completed_now: shipmentData.onboarding_completed_now || 0,
                awb_code: shipmentData.awb_code || '',
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

    private formatStateName(state: string): string {
        const stateMapping: { [key: string]: string } = {
            'KA': 'Karnataka',
            'MH': 'Maharashtra', 
            'TN': 'Tamil Nadu',
            'DL': 'Delhi',
            'UP': 'Uttar Pradesh',
            'WB': 'West Bengal',
            'GJ': 'Gujarat',
            'RJ': 'Rajasthan',
            'PB': 'Punjab',
            'HR': 'Haryana',
            'BR': 'Bihar',
            'OR': 'Odisha',
            'JH': 'Jharkhand',
            'AS': 'Assam',
            'KL': 'Kerala',
            'AP': 'Andhra Pradesh',
            'TS': 'Telangana',
            'MP': 'Madhya Pradesh',
            'CG': 'Chhattisgarh'
        };

        // If state is already full name, return as is
        if (state.length > 2) {
            return state;
        }

        // If abbreviation, convert to full name
        return stateMapping[state.toUpperCase()] || state;
    }
}

export default new ShiprocketService();