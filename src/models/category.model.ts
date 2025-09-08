import { kMaxLength } from 'buffer';
import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxLength: 50,
    },
    description: {
      type: String,
      trim: true,
      maxLength: 500,
    },
    image: {
      type: String,
      required: true
    },
    hsn: {
      type: String,
      required: true,
      maxLength: 8, 
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

categorySchema.index({ name: 'text', description: 'text' });

export interface ICategory extends mongoose.Schema {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  hsn: string;
  isActive: boolean;
}

export default mongoose.model<ICategory>('Category', categorySchema);