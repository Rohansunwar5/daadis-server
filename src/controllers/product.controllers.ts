import { NextFunction, Request, Response } from "express";
import productService from "../services/product.service";
import { BadRequestError } from "../errors/bad-request.error";

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
    const { name, code, category, sizeStock, price, originalPrice, description, sizeChart, tags, subcategory } = req.body;
    
    const response = await productService.createProduct({ name, code, category, subcategory, sizeStock: JSON.parse(sizeStock), price: Number(price), originalPrice: Number(originalPrice), description, sizeChart, tags: JSON.parse(tags), files: req.files as Express.Multer.File[]});

    next(response);
}

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { 
        name, 
        code, 
        category, 
        subcategory,
        sizeStock, 
        sizeChart, 
        price, 
        originalPrice, 
        description, 
        isActive, 
        tags,  
    } = req.body;

    const response = await productService.updateProduct(id, { 
        name,
        code,
        category,
        subcategory,
        sizeStock: sizeStock ? JSON.parse(sizeStock) : undefined,
        sizeChart,
        price: price ? Number(price) : undefined,
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        description,
        isActive: isActive !== undefined ? JSON.parse(isActive) : undefined,
        tags: tags ? JSON.parse(tags) : undefined,
        files: req.files as Express.Multer.File[]
    });

    next(response);
}

export const updateProductStock = async (req: Request, res: Response, next: NextFunction) => {
    const { productId, size, quantity } = req.body;
    
    if (!productId || !size || quantity === undefined) {
        return next(new BadRequestError('Missing required fields for stock update'));
    }

    const response = await productService.updateProductStock({ productId, size, quantity });

    next(response);
}


export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const response =  await productService.getProductById(id);

    next(response);
}

export const listProducts = async (req: Request, res: Response, next: NextFunction) => {
    const { page = 1, limit = 10, sort, ...filters } = req.query;
    const response = await productService.listProducts({
        page: Number(page),
        limit: Number(limit),
        sort: sort as string,
        filters
    });

    next(response);
}

export const getProductsByCategory = async (req: Request, res: Response, next: NextFunction) => {
    const { categoryId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const response = await productService.getProductsByCategory(categoryId, { page: Number(page), limit: Number(limit) });
    
    next(response);
}

export const searchProducts = async (req: Request, res: Response, next: NextFunction) => {
    const { q, page = 1, limit = 10 } = req.query;
    
    if (!q || typeof q !== 'string') {
        return next(new BadRequestError('Search query (q) is required'));
    }

    const response = await productService.searchProducts(q, {
        page: Number(page),
        limit: Number(limit)
    });

    next(response);
};


export const getAvailableSizes = async (req: Request, res: Response, next: NextFunction) => {
    const { productId } = req.params;
    const response = await productService.getAvailableSizes(productId);
    
    next(response);
};

export const getProductsBySubcategory = async (req: Request, res: Response, next: NextFunction) => {
    const { subcategoryId } = req.params;
    const { page = 1 , limit = 10 } = req.query
    const response = await productService.getProductsBySubcategory(subcategoryId, {
        page: Number(page),
        limit: Number(limit)
    });
    
    next(response);
};