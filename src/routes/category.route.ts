import { Router } from "express";
import { asyncHandler } from "../utils/asynchandler";
import { createCategory, deleteCategory, getAllCategories, getCategoriesWithPagination, getCategoryById, searchCategories, updateCategory } from "../controllers/category.controller";
import isAdminLoggedIn from "../middlewares/isAdminLoggedIn.middleware";
import { uploadCategoryImage, uploadProductImages } from "../middlewares/multer.middleware";

const categoryRouter = Router();

categoryRouter.get('/', asyncHandler(getAllCategories));
categoryRouter.get('/paginated', asyncHandler(getCategoriesWithPagination));
categoryRouter.get('/search', asyncHandler(searchCategories));
categoryRouter.get('/:id', asyncHandler(getCategoryById));

categoryRouter.post('/create', isAdminLoggedIn, uploadCategoryImage, asyncHandler(createCategory));
categoryRouter.put('/:id', isAdminLoggedIn, uploadCategoryImage, asyncHandler(updateCategory));
categoryRouter.delete('/:id', isAdminLoggedIn, asyncHandler(deleteCategory));

export default categoryRouter;