import mongoose from 'mongoose';

const PASSWORD_MIN_LENGTH = 8;
const PHONE_MIN_LENGTH = 9;

export enum IAuthProvider {
  EMAIL = 'email',
  GOOGLE = 'google'
}

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxLength: 40,
    },
    lastName: {
      type: String,
      trim: true,
      maxLength: 40,
    },
    email: {
      type: String,
      required: true,
      minLength: 2,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    addresses: [{
      name: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      pinCode: String,
      country: String,
      isDefault: {
        type: Boolean,
        default: false,
      }
    }],
    password: {
      type: String,
      minLength: PASSWORD_MIN_LENGTH,
    },
    authProvider: {
      type: String,
      enum: IAuthProvider,
      default: IAuthProvider.EMAIL
    },
    luckyPoints: {
      type: Number,
      default: 0,
    },
    isGuest: {
      type: Boolean,
      default: false,
    },
    verified: {
      type: Boolean,
      default: false
    }
  }, { timestamps: true }
);

userSchema.index({ email: 1 });

export interface IUser extends mongoose.Document {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  authProvider: string;
  verified: boolean;
  luckyPoints: Number;
  password?: string;
  addresses?: Array<{
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pinCode: string;
    country: string;
    isDefault: boolean;
  }>;
  isGuest?: boolean;
}

export default mongoose.model<IUser>('User', userSchema);
