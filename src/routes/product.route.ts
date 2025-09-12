import { Router } from "express";
import { asyncHandler } from "../utils/asynchandler";
import { createProduct, deleteProduct, getProductById, getProductsByCategory, listProducts, searchProducts, updateProduct } from "../controllers/product.controllers";
import isAdminLoggedIn from "../middlewares/isAdminLoggedIn.middleware";
import { searchProductValidator } from "../middlewares/validators/auth.validator";
import { uploadProductImages } from "../middlewares/multer.middleware";

const productRouter = Router();

productRouter.post('/create', isAdminLoggedIn, uploadProductImages, asyncHandler(createProduct));
productRouter.get('/search', searchProductValidator, asyncHandler(searchProducts));
productRouter.patch('/update/:id', isAdminLoggedIn, uploadProductImages, asyncHandler(updateProduct));
productRouter.delete('/delete/:id', isAdminLoggedIn, asyncHandler(deleteProduct));
productRouter.get('/products', asyncHandler(listProducts));
productRouter.get('/:id', asyncHandler(getProductById));
// productRouter.get('/:productId/sizes', updateProductStockValidator, asyncHandler(getAvailableSizes));
productRouter.get('/category/:categoryId', asyncHandler(getProductsByCategory));

export default productRouter;