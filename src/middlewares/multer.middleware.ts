import multer from 'multer';
import { BadRequestError } from '../errors/bad-request.error';

const storage = multer.memoryStorage();

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only image files are allowed!'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 
  }
});

export const uploadProductImages = upload.array('images', 10); 

export const uploadCategoryImage = upload.single('image');

export const uploadBannerImages = upload.fields([
  { name: 'imageUrl', maxCount: 1 },
  { name: 'bannerElementUrl', maxCount: 1 }
])

const blogUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024  
  }
});

export const uploadBlogImages = blogUpload.single('blogImage');