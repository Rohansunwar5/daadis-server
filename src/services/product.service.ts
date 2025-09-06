import mongoose from "mongoose";
import { BadRequestError } from "../errors/bad-request.error";
import { InternalServerError } from "../errors/internal-server.error";
import { NotFoundError } from "../errors/not-found.error";
import { CreateProductParams, CreateProductWithImagesParams, ListProductsParams, ProductRepository, UpdateProductParams, UpdateProductWithImagesParams, UpdateStockParams } from "../repository/product.repository";
import { uploadToCloudinary } from "../utils/cloudinary.util";

interface SearchProductsParams {
  page: number;
  limit: number;
}

class ProductService {
    constructor(private readonly _productRepository: ProductRepository) {}

    async createProduct(params: CreateProductWithImagesParams) {
        if (!params.code) throw new BadRequestError('Product code is required');

        const existingProduct = await this._productRepository.getProductByCode(params.code);
        if (existingProduct) throw new BadRequestError('Product with this code already exists')

        const imageUrls = await this.handleImageUploads({ files: params.files, existingImages: params.existingImages });

        const productParams: CreateProductParams = {
            name: params.name,
            code: params.code,
            category: params.category,
            price: params.price,
            description: params.description,
            images: imageUrls,
            isActive: params.isActive ?? true,
            tags: params.tags,
            dimensions: params.dimensions,
            stock: params.stock,
            vegetarian: params.vegetarian,
            weight: params.weight
        };

        const product = await this._productRepository.createProduct(productParams);
        if (!product) throw new InternalServerError('Failed to create product')

        return product;
    }
    
    async updateProduct(id: string, params: UpdateProductWithImagesParams) {
        const product = await this._productRepository.getProductById(id);
        if (!product) throw new NotFoundError('Product not found');

        if (params.code && params.code !== product.code) {
            const existingProduct = await this._productRepository.getProductByCode(params.code);
            if (existingProduct) throw new BadRequestError('Product with this code already exists');
        }
        
        let imageUrls: string[] = product.images || [];
        
        if (params.files?.length) {
            try {   
                const uploadPromises = params.files.map((file: Express.Multer.File) => uploadToCloudinary(file));
                imageUrls = await Promise.all(uploadPromises);
            } catch (error) {
                throw new BadRequestError('Failed to upload product images');
            }
        }

        const updateParams: UpdateProductParams = {
            name: params.name,
            code: params.code,
            category: params.category,
            price: params.price,
            description: params.description,
            images: params.files?.length ? imageUrls : undefined, 
            isActive: params.isActive,
            tags: params.tags,
            dimensions: params.dimensions,
            stock: params.stock,
            vegetarian: params.vegetarian,
            weight: params.weight
        };

        Object.keys(updateParams).forEach(key => {
            const value = updateParams[key as keyof UpdateProductParams];
            if (value === undefined || value === null) {
                delete updateParams[key as keyof UpdateProductParams];
            }
        });

        const updatedProduct = await this._productRepository.updateProduct(id, updateParams);
        if (!updatedProduct) {
            throw new InternalServerError('Failed to update product');
        }

        return updatedProduct;
    }


    async updateProductStock(params: UpdateStockParams) {
        const { productId, quantity } = params;

        const updatedProduct = await this._productRepository.updateProductStock({productId, quantity});

        if (!updatedProduct) throw new NotFoundError('Product not found')

        return updatedProduct;
    }

    private async handleImageUploads(params: { files?: Express.Multer.File[], existingImages?: string[] }): Promise<string[]> {
        let imageUrls: string[] = [];

        if (params.existingImages) {
            imageUrls = Array.isArray(params.existingImages) ? params.existingImages : [params.existingImages];
        }

        if (params.files && params.files.length > 0) {
            const uploadPromises = params.files.map(file => uploadToCloudinary(file));
            const newImageUrls = await Promise.all(uploadPromises);
            imageUrls = [...imageUrls, ...newImageUrls];
        }

        if (imageUrls.length === 0) throw new BadRequestError('At least one product image is required');

        return imageUrls;
    }

    async getProductById(id: string) {
        const product = await this._productRepository.getProductById(id);
        if (!product) throw new NotFoundError('Product not found')
        
        return product;
    }

    async listProducts(params: ListProductsParams) {
        const { page, limit, sort, filters } = params;
        
        return this._productRepository.listProducts({ page, limit, sort, filters });
    } 

    async getProductsByCategory(categoryId: string, params: SearchProductsParams) {
        const { page, limit } = params;

        return this._productRepository.getProductsByCategory(categoryId, { page, limit });
    }

    async searchProducts(query: string, params: SearchProductsParams) {
        const { page, limit } = params;

        if (!query.trim()) throw new BadRequestError('Search query cannot be empty')

        return this._productRepository.searchProducts(query, { page, limit});
    }

    // async getAvailableSizes(productId: string) {
    //     return this._productRepository.getAvailableSizes(productId);
    // }

     async reduceStockForOrder(orderItems: Array<{ productId: string; quantity: number; productName?: string }>) {
        if (!orderItems || orderItems.length === 0) {
            throw new BadRequestError('No order items provided for stock reduction');
        }

        for (const item of orderItems) {
            if (!item.productId || !item.quantity || item.quantity <= 0) {
                throw new BadRequestError('Invalid order item data for stock reduction');
            }
        }

        await this._validateStockAvailability(orderItems);
        const session = await this._productRepository.startSession();
        
        try {
            await session.withTransaction(async () => {
                for (const item of orderItems) {
                    const result = await this._productRepository.reduceProductStock(
                        item.productId,
                        item.quantity,
                        session
                    );

                    if (result.matchedCount === 0) {
                        throw new BadRequestError(
                            `Product not found or insufficient stock: ${item.productName || item.productId}`
                        );
                    }

                    if (result.modifiedCount === 0) {
                        throw new BadRequestError(
                            `Failed to reduce stock for: ${item.productName || item.productId}`
                        );
                    }
                }
            });
            
            return { success: true, message: 'Stock reduced successfully' };
            
        } catch (error) {
            console.error('Error reducing stock for order:', error);
            throw error;
        } finally {
            await session.endSession();
        }
    }

    async validateStockForOrder(orderItems: Array<{productId: string; size: string; quantity: number; productName?: string }>) {

        if (!orderItems || orderItems.length === 0) throw new BadRequestError('No order items provided for stock validation');

        return this._validateStockAvailability(orderItems);
    }

    private async _validateStockAvailability(orderItems: Array<{ productId: string;  quantity: number; productName?: string }>) {
        const insufficientItems = [];

        for (const orderItem of orderItems) {
            const currentStock = await this._productRepository.getProductStock(orderItem.productId);

            if(currentStock < orderItem.quantity) {
                insufficientItems.push({
                    productId: orderItem.productId,
                    productName: orderItem.productName,
                    requestedQuantity: orderItem.quantity,
                    availableStock: currentStock,
                    reason: 'Insufficient stock'
                })
            }
        } 

        if (insufficientItems.length > 0) {
            const errorMessage = insufficientItems.map(item => 
                `${item.productName || item.productId}: ` +
                `requested ${item.requestedQuantity}, available ${item.availableStock} - ${item.reason}`
            ).join('; ');
            throw new BadRequestError(`Stock validation failed: ${errorMessage}`);
        }

        return { success: true, message: 'Stock validation passed' };
    }

    async addProductRating(productId: string, userId: string, rating: number, review?: string) {
        const product = await this._productRepository.getProductById(productId);
        if (!product) throw new NotFoundError('Product not found');

        if (rating < 1 || rating > 5) {
            throw new BadRequestError('Rating must be between 1 and 5');
        }

        const existingRatingIndex = product.ratings.findIndex(
            r => r.userId.toString() === userId
        );

        const ratingData = {
            userId: new mongoose.Types.ObjectId(userId), 
            value: rating,
            review: review || '',
            createdAt: new Date()
        };

        let updatedRatings;
        if (existingRatingIndex !== -1) {
            updatedRatings = [...product.ratings];
            updatedRatings[existingRatingIndex] = ratingData;
        } else {
            updatedRatings = [...product.ratings, ratingData];
        }

        return this._productRepository.updateProduct(productId, { 
            ratings: updatedRatings 
        });
    }


    async getProductRatings(productId: string, page: number = 1, limit: number = 10) {
        const product = await this._productRepository.getProductById(productId);
        if(!product) throw new NotFoundError('Product not found');

        const startIndex = (page -1) * limit;
        const endIndex = startIndex + limit;
        const paginatedRatings = product.ratings
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(startIndex, endIndex);

        return {
            ratings: paginatedRatings,
            total: product.ratings.length,
            page,
            pages: Math.ceil(product.ratings.length / limit),
            averageRating: product.ratings.length > 0 
                ? product.ratings.reduce((sum, r) => sum + r.value, 0) / product.ratings.length 
                : 0
        };
    }
}

export default new ProductService(new ProductRepository());