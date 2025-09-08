import { BadRequestError } from "../errors/bad-request.error";
import { InternalServerError } from "../errors/internal-server.error";
import { NotFoundError } from "../errors/not-found.error";
import { CategoryRepository, IUpdateCategoryParams } from "../repository/category.repository";
import { uploadToCloudinary } from "../utils/cloudinary.util";

interface CreateCategoryParams {
    name: string;
    description?: string;
    file?: Express.Multer.File;
    existingImage?: string;
    hsn?: string;
}

class CategoryService {
    constructor(private readonly _categoryRepository: CategoryRepository) {}

    async createCategory (params:CreateCategoryParams) {
        const existingCategory = await this._categoryRepository.getCategoryByName(params.name);
        if (existingCategory) {
            throw new BadRequestError('Category with this name already exists');
        }

        const imageUrl = await this.handleImageUpload({ 
            file: params.file, 
            existingImage: params.existingImage 
        });


        const category = await this._categoryRepository.createCategory({
            name: params.name.trim(),
            description: params.description,
            image: imageUrl,
            hsn: params.hsn
        });

        if(!category) throw new InternalServerError('Failed to create category');

        return category;
    }

    private async handleImageUpload(params: { 
        file?: Express.Multer.File, 
        existingImage?: string 
    }): Promise<string> {
        let imageUrl: string = '';

        // If existing image URL is provided, use it
        if (params.existingImage) {
            imageUrl = params.existingImage;
        }

        // If a new file is uploaded, upload to cloudinary
        if (params.file) {
            imageUrl = await uploadToCloudinary(params.file);
        }

        // Require at least one image for category
        if (!imageUrl) {
            throw new BadRequestError('Category image is required');
        }

        return imageUrl;
    }

    async getAllCategories() {
        return this._categoryRepository.getAllCategories();
    }

    async getCategoryById(id: string) {
        const response = await this._categoryRepository.getCategoryById(id);
        if(!response) throw new NotFoundError('category not found');

        return response;
    } 

    async deleteCategory(id: string) {
        if(!id) throw new BadRequestError('Category ID is required');

        const deletedCategory = await this._categoryRepository.deleteCategory(id);
        if(!deletedCategory) throw new NotFoundError('Category not found');

        return deletedCategory;
    }

    async updateCategory(id: string, params: IUpdateCategoryParams
    ) {
        if (!id) throw new BadRequestError('Category ID is required');

        const existingCategory = await this._categoryRepository.getCategoryById(id);
        if (!existingCategory) throw new NotFoundError('Category not found');

        if (params.name && params.name !== existingCategory.name) {
            const duplicateCategory = await this._categoryRepository.getCategoryByName(params.name);
            if (duplicateCategory) {
                throw new BadRequestError('Category with this name already exists');
            }
        }

        let imageUrl = existingCategory.image;

        if (params.existingImage) {
            imageUrl = params.existingImage;
        }
        
        if (params.file) {
            imageUrl = await this.handleImageUpload({ 
                file: params.file, 
                existingImage: params.existingImage 
            });
        }

        const updateData = {
            name: params.name,
            description: params.description,
            isActive: params.isActive,
            image: imageUrl,
            hsn: params.hsn
        };

        const updatedCategory = await this._categoryRepository.updateCategory(id, updateData);
        if (!updatedCategory) throw new NotFoundError('Failed to update category');

        return updatedCategory;
    }

    async getCategoryByName(name: string) {
        if (!name) throw new BadRequestError('Category name is required');

        const category = await this._categoryRepository.getCategoryByName(name);
        if (!category) throw new NotFoundError('Category not found');

        return category;
    }

    async searchCategories(searchTerm: string) {
        if (!searchTerm?.trim()) throw new BadRequestError('Search term is required');

        return this._categoryRepository.searchCategories(searchTerm.trim());
    }

    async getCategoriesWithPagination(page: number = 1, limit: number = 10) {
        if (page < 1) throw new BadRequestError('Page must be greater than 0');
        if (limit < 1 || limit > 50) throw new BadRequestError('Limit must be between 1 and 50');

        return this._categoryRepository.getCategoriesWithPagination(page, limit);
    }
}

export default new CategoryService(new CategoryRepository());