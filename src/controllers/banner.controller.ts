import { NextFunction, Request, Response } from "express";
import bannerService from "../services/banner.service";

export const getAllBanners = async (req: Request, res: Response, next: NextFunction) => {
  const response = await bannerService.getAllBanners();
  next(response);
};

export const getAllBannersOfAType = async (req: Request, res: Response, next: NextFunction) => {
  const { bannerType } = req.params;
  const response = await bannerService.getAllBannersOfAType(bannerType);
  next(response);
};

export const getABannerById = async (req: Request, res: Response, next: NextFunction) => {
  const { bannerId } = req.params;
  const response = await bannerService.getABannerById(bannerId);
  next(response);
};

export const createABanner = async (req: Request, res: Response, next: NextFunction) => {
  const { bannerName, bannerText, bannerType, bannerCategory, bannerColours } = req.body;
  const { user } = req;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  
  const response = await bannerService.createABanner({ 
    bannerName, 
    bannerText, 
    bannerType, 
    bannerCategory,
    bannerColours: bannerColours ? JSON.parse(bannerColours) : [],
    files,
  });
  
  next(response);
};

export const updateABanner = async (req: Request, res: Response, next: NextFunction) => {
  const { bannerId } = req.params;
  const { bannerName, bannerText, bannerType, bannerCategory, bannerColours } = req.body;
  const { user } = req;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  
  const response = await bannerService.updateABanner({ 
    bannerId, 
    bannerName, 
    bannerText, 
    bannerType, 
    bannerCategory,
    bannerColours: bannerColours ? JSON.parse(bannerColours) : [],
    files,
  });
  
  next(response);
};

export const deleteABanner = async (req: Request, res: Response, next: NextFunction) => {
  const { bannerId } = req.params;
  const { user } = req;
  const response = await bannerService.deleteABanner({ bannerId, user });
  next(response);
};