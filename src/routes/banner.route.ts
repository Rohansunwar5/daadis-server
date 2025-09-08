import { Router } from "express";
import isAdminLoggedIn from "../middlewares/isAdminLoggedIn.middleware";
import { uploadBannerImages } from "../middlewares/multer.middleware";
import { asyncHandler } from "../utils/asynchandler";
import { createABanner, deleteABanner, getABannerById, getAllBanners, getAllBannersOfAType, updateABanner } from "../controllers/banner.controller";


const bannerRouter = Router();

bannerRouter.get('/', isAdminLoggedIn, asyncHandler(getAllBanners));
bannerRouter.get('/type/:bannerType', asyncHandler(getAllBannersOfAType));
bannerRouter.get('/:bannerId', asyncHandler(getABannerById));
bannerRouter.post('/create', isAdminLoggedIn, uploadBannerImages, asyncHandler(createABanner));
bannerRouter.put('/update/:bannerId', isAdminLoggedIn, uploadBannerImages, asyncHandler(updateABanner));
bannerRouter.delete('/delete/:bannerId', isAdminLoggedIn, asyncHandler(deleteABanner));

export default bannerRouter;