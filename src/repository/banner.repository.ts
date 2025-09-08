import bannerModel, {IBanner, IBannerType} from "../models/banner.model";

export interface ICreateBannerParams {
    imageUrl: {
        url: string;
        publicId: string;
    };
    bannerName: string;
    bannerText?: string;
    bannerType: IBannerType;
    bannerCategory?: string;
    bannerColours?: string[];
    bannerElementUrl?: {
        url?: string;
        publicId?: string;
    };
}


export class BannerRepository {
    private _model = bannerModel;

    async getAllBanners() {
        return this._model.find();
    }

    async getBannersByType(bannerType: IBannerType): Promise<IBanner[]> {
        return this._model.find({ bannerType });
    }

    async getBannerById(bannerId: string): Promise<IBanner | null> {
        return this._model.findById(bannerId);
    }

    async createBanner(bannerData: ICreateBannerParams): Promise<IBanner> {
        return this._model.create(bannerData);
    }

    async updateBanner(bannerId: string, updateData: Partial<ICreateBannerParams>): Promise<IBanner | null> {
        return this._model.findByIdAndUpdate(
        bannerId,
        updateData,
        { new: true }
        );
    }

    async deleteBanner(bannerId: string): Promise<any> {
        return this._model.deleteOne({ _id: bannerId });
    }

    async getBannersByCategory(categoryId: string): Promise<IBanner[]> {
        return this._model.find({ bannerCategory: categoryId });
    }
}