import mongoose from 'mongoose';

export enum IWeight {
    KG = 'kg',
    G = 'g',
}

export interface IDimensions {
    l: number;
    b: number;
    h: number;
}

export interface IWeightValue {
    number: number;
    unit: IWeight;
}

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            maxLength: 100,
        },
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        category: {
            type: mongoose.Types.ObjectId,
            required: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        description: {
            type: String,
            trim: true,
            maxLength: 2000
        }, 
        images: [{
            type: String,
            required: true,
        }],
        offer: {
            type: mongoose.Types.ObjectId,
        },
        ratings: [{
            userId: {
                type: mongoose.Types.ObjectId,
                required: true,
            },
            value: {
                type: Number,
                required: true,
                min: 1,
                max: 5
            },
            review: {
                type: String,
                maxLength: 500
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }],
        isActive: {
            type: Boolean,
            default: true,
        },
        tags: [{
            type: String,
            trim: true,
        }],
        dimensions: {
            l: {
                type: Number,
                required: true,
            },
            b: {
                type: Number,
                required: true,
            },
            h: {
                type: Number,
                required: true,
            }
        },
        stock: {
            type: Number,
            required: true,
            default: 0,
        },
        vegetarian: {
            type: Boolean,
            required: true,
        },
        quantitySold: {
            type: Number,
            default: 0,
        },
        weight: {
            number: {
                type: Number,
                required: true,
            },
            unit: {
                type: String,
                required: true,
                enum : IWeight,
                default: IWeight.KG,
            }
        }
    }, { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });

export interface IRating {
    userId: mongoose.Types.ObjectId;
    value: number;
    review?: string;
    createdAt: Date;
}

export interface IProduct extends mongoose.Schema {
    _id: string;
    name: string;
    code: string;
    category: mongoose.Types.ObjectId;
    price: number;
    description?: string;
    images: string [];
    offer?: mongoose.Types.ObjectId;
    isActive: boolean;
    ratings: IRating[];
    tags?: string[];
    dimensions: IDimensions;
    stock: number;
    vegetarian: boolean;
    quantitySold?: number;
    weight: IWeightValue;
    createdAt?: Date;
    updatedAt?: Date;
}

export default mongoose.model<IProduct>('Product', productSchema);