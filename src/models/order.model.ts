import mongoose from 'mongoose';
import { IPaymentMethod, IPaymentStatus } from './payment.model';

export enum IOrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
  RETURNED = 'returned',
  PAID = 'paid',
}

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Types.ObjectId,
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  productCode: {
    type: String,
    required: true,
  },
  productImage: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  priceAtPurchase: {
    type: Number,
    required: true,
    min: 0,
  },
  itemTotal: {
    type: Number,
    required: true,
    min: 0,
  }
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Types.ObjectId,
      required: true,
    },
    items: [orderItemSchema],
    shippingAddress: {
      name: {
        type: String,
        required: true,
      },
      addressLine1: {
        type: String,
        required: true,
      },
      addressLine2: {
        type: String,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      pinCode: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
        default: 'India',
      },
      phone: {
        type: String,
        required: true,
      }
    },
    billingAddress: {
      name: {
        type: String,
        required: true,
      },
      addressLine1: {
        type: String,
        required: true,
      },
      addressLine2: {
        type: String,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      pinCode: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
        default: 'India',
      },
      phone: {
        type: String,
        required: true,
      }
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    appliedCoupon: {
      code: String,
      discountId: mongoose.Types.ObjectId,
      discountAmount: Number,
    },
    appliedVoucher: {
      code: String,
      discountId: mongoose.Types.ObjectId,
      discountAmount: Number,
    },
    totalDiscountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippingCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: IOrderStatus,
      default: IOrderStatus.PENDING,
    },
    paymentMethod: {
      type: String,
      enum: IPaymentMethod,
    },
    paymentStatus: {
      type: String,
      enum: IPaymentStatus,
      default: IPaymentStatus.CREATED
    },
    trackingNumber: {
      type: String,
    },
    estimatedDeliveryDate: {
      type: Date,
    },
    actualDeliveryDate: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancelReason: {
      type: String,
    },
    returnedAt: {
      type: Date,
    },
    returnReason: {
      type: String,
    },
    notes: {
      type: String,
      maxLength: 500,
    },
    // Shiprocket fields
    shipmentId: {
      type: String,
    },
    awbNumber: {
      type: String,
    },
    courierName: {
      type: String,
    },
    trackingUrl: {
      type: String,
    },
    labelUrl: {
      type: String,
    }
  },
  { timestamps: true }
);

// Indexes for better query performance
orderSchema.index({ user: 1, status: 1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ awbNumber: 1 });
orderSchema.index({ shipmentId: 1 });

export interface IOrderItem {
  _id: string;
  product: mongoose.Types.ObjectId;
  productName: string;
  productCode: string;
  productImage: string;
  quantity: number;
  priceAtPurchase: number;
  itemTotal: number;
}

export interface IAddress {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
  phone: string;
}

export interface IShiprocketDetails {
  shipmentId?: string;
  awbNumber?: string;
  courierName?: string;
  trackingUrl?: string;
  labelUrl?: string;
}

export interface IOrder extends mongoose.Document {
  _id: string;
  orderNumber: string;
  user: mongoose.Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IAddress;
  billingAddress: IAddress;
  subtotal: number;
  appliedCoupon?: {
    code: string;
    discountId: mongoose.Types.ObjectId;
    discountAmount: number;
  };
  appliedVoucher?: {
    code: string;
    discountId: mongoose.Types.ObjectId;
    discountAmount: number;
  };
  totalDiscountAmount: number;
  shippingCharge: number;
  taxAmount: number;
  total: number;
  status: IOrderStatus;
  paymentMethod?: IPaymentMethod;
  paymentStatus: IPaymentStatus;
  trackingNumber?: string;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  returnedAt?: Date;
  returnReason?: string;
  notes?: string;
  // Shiprocket fields
  shipmentId?: string;
  awbNumber?: string;
  courierName?: string;
  trackingUrl?: string;
  labelUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default mongoose.model<IOrder>('Order', orderSchema);
