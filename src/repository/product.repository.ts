import productModel, { IDimensions, IRating, IWeightValue } from "../models/product.model";

export interface CreateProductParams {
    name: string;
    code: string;
    category: string;
    price: number;
    description?: string;
    images: string[];
    isActive?: boolean;
    tags?: string[];
    dimensions: IDimensions;
    stock: number;
    vegetarian: boolean;
    weight: IWeightValue;
}

export interface CreateProductWithImagesParams extends Omit<CreateProductParams, 'images'> {
    files?: Express.Multer.File[];
    existingImages?: string[];
}

export interface UpdateProductParams {
    name?: string;
    code?: string;
    category?: string;
    price?: number;
    description?: string;
    images?: string[];
    isActive?: boolean;
    tags?: string[];
    dimensions?: Partial<IDimensions>;
    stock?: number;
    vegetarian?: boolean;
    weight?: IWeightValue;
    ratings?: IRating[];
}

export interface UpdateProductWithImagesParams extends Omit<UpdateProductParams, 'images'> {
    files?: Express.Multer.File[];
    existingImages?: string[];
}

export interface ListProductsParams {
    page: number;
    limit: number;
    sort?: string;
    filters?: Record<string , any>;
}

export interface UpdateStockParams {
    productId: string;
    quantity: number;
}

export class ProductRepository {
    private _model = productModel;

    async createProduct(params: CreateProductParams) {
        return this._model.create(params);
    }

    async updateProductStock(params: UpdateStockParams) {
        const { productId, quantity } = params;
        
        return this._model.findByIdAndUpdate(
            productId,
            { $inc: { stock: quantity } },
            { new: true }
        );
    }

    async updateProduct(id: string, params: UpdateProductParams) {
        const updateData = { ...params };
        
        if (params.dimensions) {
            const product = await this._model.findById(id);
            if (product) {
                updateData.dimensions = {
                    l: params.dimensions.l ?? product.dimensions.l,
                    b: params.dimensions.b ?? product.dimensions.b,
                    h: params.dimensions.h ?? product.dimensions.h
                };
            }
        }

        return this._model.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true, runValidators: true }
        );
    }

    async getProductById(id: string) {
        return this._model.findById(id);
    }

    async getProductByCode(code: string) {
        return this._model.findOne({ code });
    }

    async listProducts(params: ListProductsParams) {
        const { page, limit, sort, filters = {} } = params;
        const query: Record<string, any> = { isActive: true };
        
        if (filters.category) query.category = filters.category;
        if (filters.minPrice || filters.maxPrice) {
            query.price = {};
            if (filters.minPrice) query.price.$gte = Number(filters.minPrice);
            if (filters.maxPrice) query.price.$lte = Number(filters.maxPrice);
        }
        if (filters.vegetarian !== undefined) {
            query.vegetarian = filters.vegetarian === 'true';
        }
        if (filters.inStock === 'true') {
            query.stock = { $gt: 0 };
        }
        
        const [products, total] = await Promise.all([
            this._model.find(query)
                .sort(sort || '-createdAt')
                .skip((page - 1) * limit)
                .limit(limit),
            this._model.countDocuments(query)
        ]);
        
        return {
            products,
            total,
            page,
            pages: Math.ceil(total / limit)
        };
    }

    async getProductsByCategory(categoryId: string, params: Omit<ListProductsParams, 'filters'>) {
        const { page, limit } = params;
        const query = { 
            category: categoryId, 
            isActive: true,
            stock: { $gt: 0 }
        };
        
        const [products, total] = await Promise.all([
            this._model.find(query)
                .skip((page - 1) * limit)
                .limit(limit),
            this._model.countDocuments(query)
        ]);
        
        return {
            products,
            total,
            page,
            pages: Math.ceil(total / limit)
        };
    }
    
    async searchProducts(query: string, params: Omit<ListProductsParams, 'filters'> & { categoryId?: string }) {
        const { page, limit, categoryId } = params;
        
        const searchQuery: any = { 
            $text: { $search: query }, 
            isActive: true,
            stock: { $gt: 0 }
        };
        
        if (categoryId) searchQuery.category = categoryId;
        
        const [products, total] = await Promise.all([
            this._model.find(searchQuery)
                .sort({ score: { $meta: 'textScore' } })
                .skip((page - 1) * limit)
                .limit(limit),
            this._model.countDocuments(searchQuery)
        ]);
        
        return {
            products,
            total,
            page,
            pages: Math.ceil(total / limit)
        };
    }

    async reduceProductStock(productId: string, quantity: number, session?: any) {
        return this._model.updateOne(
            { 
                _id: productId,
                stock: { $gte: quantity }
            },
            { 
                $inc: { 
                    stock: -quantity,
                    quantitySold: quantity
                }
            },
            { session }
        );
    }

    async getProductStock(productId: string) {
        const product = await this._model.findById(productId).select('stock');
        return product?.stock || 0;
    }

    async startSession() {
        return this._model.db.startSession();
    }

    async getLowStockProducts(threshold: number = 5) {
        return this._model.find({
            isActive: true,
            stock: { $lte: threshold, $gt: 0 }
        }).select('name code stock');
    }

    async getOutOfStockProducts() {
        return this._model.find({
            isActive: true,
            stock: 0
        }).select('name code stock');
    }

    async deleteProductPermanently(id: string) {
        return this._model.findByIdAndDelete(id);
    }
}