import { BadRequestError } from "../errors/bad-request.error";
import { InternalServerError } from "../errors/internal-server.error";
import { NotFoundError } from "../errors/not-found.error";
import { UnauthorizedError } from "../errors/unauthorized.error";
import { IBannerType } from "../models/banner.model";
import { BannerRepository } from "../repository/banner.repository";
import { uploadToCloudinary } from "../utils/cloudinary.util";

interface CreateBannerParams {
  bannerName: string;
  bannerText?: string;
  bannerType: IBannerType;
  bannerCategory?: string;
  bannerColours?: string[];
  files?: { [fieldname: string]: Express.Multer.File[] };
}

interface UpdateBannerParams {
  bannerId: string;
  bannerName?: string;
  bannerText?: string;
  bannerType?: IBannerType;
  bannerCategory?: string;
  bannerColours?: string[];
  files?: { [fieldname: string]: Express.Multer.File[] };
}

class BannerService {
    constructor (private readonly _bannerRepository: BannerRepository) {}

    private async handleImageUpload(file: Express.Multer.File): Promise<{ url: string; publicId: string }> {
        const uploadResult = await uploadToCloudinary(file);
        
        // Extract publicId from the Cloudinary URL
        // URL format: https://res.cloudinary.com/cloudname/image/upload/v1234567890/sweety/filename.jpg
        const urlParts = uploadResult.split('/');
        const fileWithExtension = urlParts[urlParts.length - 1];
        const publicId = `sweety/${fileWithExtension.split('.')[0]}`;
        
        return {
            url: uploadResult,
            publicId: publicId
        };
    }

    private async handleBannerImageUploads(params: { 
        files?: { [fieldname: string]: Express.Multer.File[] };
        existingImageUrl?: { url: string; publicId: string };
        existingBannerElementUrl?: { url?: string; publicId?: string };
    }) {
        let imageUrl = params.existingImageUrl;
        let bannerElementUrl = params.existingBannerElementUrl;

        if(params.files?.imageUrl && params.files.imageUrl[0]) {
            imageUrl = await this.handleImageUpload(params.files.imageUrl[0]);
        }

        if (params.files?.bannerElementUrl && params.files.bannerElementUrl[0]) {
            bannerElementUrl = await this.handleImageUpload(params.files.bannerElementUrl[0]);
        }

        if (!imageUrl) {
            throw new BadRequestError('Banner main image is required');
        }

        return { imageUrl, bannerElementUrl };
    }

    async getAllBanners() {
        const allBanners = await this._bannerRepository.getAllBanners();
        
        if (!allBanners || allBanners.length === 0) {
            throw new NotFoundError('No banners found!');
        }

        return allBanners;
    }

    async getAllBannersOfAType(bannerType: string) {
        if (!bannerType || typeof bannerType !== 'string') {
            throw new BadRequestError('Banner type not received!');
        }

        if (!Object.values(IBannerType).includes(bannerType as IBannerType)) {
            throw new BadRequestError('Invalid banner type!');
        }

        const banners = await this._bannerRepository.getBannersByType(bannerType as IBannerType);

        if (!banners) {
            throw new InternalServerError('Failed to fetch banners!');
        }

        return banners;
    }

    async getABannerById(bannerId: string) {
        if (!bannerId) {
            throw new BadRequestError('No banner ID received!');
        }

        const banner = await this._bannerRepository.getBannerById(bannerId);
        
        if (!banner) {
            throw new NotFoundError(`No banner with ID ${bannerId} found`);
        }

        return banner;
    }

    async createABanner(params: CreateBannerParams) {
        const { bannerName, bannerText, bannerType, bannerCategory, bannerColours, files } = params;

        if (!bannerName) {
            throw new BadRequestError('Banner name is required');
        }

        if (!bannerType || !Object.values(IBannerType).includes(bannerType)) {
            throw new BadRequestError('Valid banner type is required');
        }

        const { imageUrl, bannerElementUrl } = await this.handleBannerImageUploads({ files });

        const bannerData = { 
            bannerName, 
            bannerText, 
            bannerType, 
            bannerCategory, 
            bannerColours, 
            imageUrl, 
            bannerElementUrl 
        };

        const bannerCreationResponse = await this._bannerRepository.createBanner(bannerData);

        if (!bannerCreationResponse) {
            throw new InternalServerError('Banner creation failed!');
        }

        return bannerCreationResponse;
    }

    async updateABanner(params: UpdateBannerParams) {
        const { bannerId, bannerName, bannerText, bannerType, bannerCategory, bannerColours, files} = params;

        if (!bannerId) {
            throw new BadRequestError('Banner ID not received!');
        }

        // Get existing banner to preserve existing images if no new ones are uploaded
        const existingBanner = await this._bannerRepository.getBannerById(bannerId);
        if (!existingBanner) {
            throw new NotFoundError('Banner not found');
        }

        const { imageUrl, bannerElementUrl } = await this.handleBannerImageUploads({ 
            files,
            existingImageUrl: existingBanner.imageUrl,
            existingBannerElementUrl: existingBanner.bannerElementUrl
        });

        const updateData = {
            ...(bannerName && { bannerName }),
            ...(bannerText !== undefined && { bannerText }),
            ...(bannerType && { bannerType }),
            ...(bannerCategory !== undefined && { bannerCategory }),
            ...(bannerColours && { bannerColours }),
            imageUrl,
            ...(bannerElementUrl && { bannerElementUrl })
        };

        const updatedBannerData = await this._bannerRepository.updateBanner(bannerId, updateData);

        if (!updatedBannerData) {
            throw new InternalServerError('Banner update failed!');
        }

        return updatedBannerData;
    }

    async deleteABanner(params: { bannerId: string; user: any }) {
        const { bannerId, user } = params;

        if (!(user?.role === 'Admin')) {
            throw new UnauthorizedError('Unauthorized request!');
        }

        if (!bannerId) {
            throw new BadRequestError('Banner ID not received!');
        }

        const deleteResponse = await this._bannerRepository.deleteBanner(bannerId);

        if (!deleteResponse) {
            throw new InternalServerError('Unable to delete banner!');
        }

        return deleteResponse;
    }
}

export default new BannerService(new BannerRepository());
