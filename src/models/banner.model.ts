import mongoose from 'mongoose';

export enum IBannerType {
    HERO_SECTION_BANNER = 'hero-section-banner',
    CATEGORY_BANNER = 'category-banner',
    HOME_PAGE_BANNER = 'home-page-banner',
    PARTNER_BANNER = 'partner-banner',
}

export interface IImageUrl {
    url: string;
    publicId: string;
}

export interface IBannerElementUrl {
    url?: string;
    publicId?: string;
}

const bannerSchema = new mongoose.Schema(
    {
        imageUrl: {
            url: {
                type: String,
                required: true,
            },
            publicId: {
                type: String,
                required: true,
            }
        },
        bannerName: {
            type: String,
            required: true,
        },
        bannerText: {
            type: String,
        },
        bannerType: {
            type: String,
            required: true,
            enum: IBannerType,
        },
        bannerCategory: {
            type: mongoose.Types.ObjectId,
        },
        bannerColours: [{
            type: String,
            maxLength: [6, "A hex value cannot be more than 6 characters in length!"]
        }],
        bannerElementUrl: {
            url: {
                type: String,
            },
            publicId: {
                type: String,
            }
        }
    }, { timestamps: true }
);

export interface IBanner extends mongoose.Document {
    _id: string;
    imageUrl: IImageUrl;
    bannerName: string;
    bannerText?: string;
    bannerType: IBannerType;
    bannerCategory?: mongoose.Types.ObjectId;
    bannerColours?: string[];
    bannerElementUrl?: IBannerElementUrl;
    createdAt?: Date;
    updatedAt?: Date;
}

export default mongoose.model<IBanner>('Banner', bannerSchema);
