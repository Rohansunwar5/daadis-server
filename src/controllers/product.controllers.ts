import { NextFunction, Request, Response } from "express";
import productService from "../services/product.service";
import { BadRequestError } from "../errors/bad-request.error";

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
    const { name,  code,  category,  price,  description,  tags,  stock, vegetarian, weightNumber, weightUnit, dimensionsL, dimensionsB, dimensionsH } = req.body;
    
    const response = await productService.createProduct({ 
        name, 
        code, 
        category, 
        price: Number(price), 
        description, 
        tags: tags ? JSON.parse(tags) : [],
        stock: Number(stock),
        vegetarian: JSON.parse(vegetarian),
        weight: {
            number: Number(weightNumber),
            unit: weightUnit
        },
        dimensions: {
            l: Number(dimensionsL),
            b: Number(dimensionsB),
            h: Number(dimensionsH)
        },
        files: req.files as Express.Multer.File[]
    });

    next(response);
}

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { 
        name, 
        code, 
        category, 
        price, 
        description, 
        isActive, 
        tags, 
        stock, 
        vegetarian, 
        weightNumber, 
        weightUnit, 
        dimensionsL, 
        dimensionsB, 
        dimensionsH 
    } = req.body;

    console.log('Update Product ID:', id);
    console.log('Request Body:', req.body);
    
    const response = await productService.updateProduct(id, { 
        name,
        code,
        category,
        price: price ? Number(price) : undefined,
        description,
        isActive: isActive !== undefined && isActive !== null ? JSON.parse(isActive) : undefined,
        tags: tags ? JSON.parse(tags) : undefined,
        stock: stock ? Number(stock) : undefined, 
        vegetarian: vegetarian !== undefined && vegetarian !== null ? JSON.parse(vegetarian) : undefined,
        weight: (weightNumber && weightUnit) ? {
            number: Number(weightNumber),
            unit: weightUnit
        } : undefined,
        dimensions: (dimensionsL || dimensionsB || dimensionsH) ? {
            l: dimensionsL ? Number(dimensionsL) : undefined,
            b: dimensionsB ? Number(dimensionsB) : undefined,
            h: dimensionsH ? Number(dimensionsH) : undefined
        } : undefined,
        files: req.files as Express.Multer.File[]
    });

    next(response);
}


export const updateProductStock = async (req: Request, res: Response, next: NextFunction) => {
    const { productId, quantity } = req.body;
    
    if (!productId || quantity === undefined) {
        return next(new BadRequestError('Missing required fields for stock update'));
    }

    const response = await productService.updateProductStock({ productId, quantity });

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