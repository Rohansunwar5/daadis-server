import { NextFunction, Request, Response } from 'express';
import authService from '../services/auth.service';

export const genericLogin = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  const response = await authService.login({ email, password });

  next(response);
};

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  const { firstName, lastName, email, password, phoneNumber } = req.body;
  const response = await authService.signup({ firstName, lastName, email, password, phoneNumber });

  next(response);
};

export const profile = async (req: Request, res: Response, next: NextFunction) => {
  const { _id } = req.user;
  const response = await authService.profile(_id);

  next(response);
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { _id } = req.user;
    const { firstName, lastName, email, phoneNumber,  addresses } = req.body;

    const response = await authService.updateProfile({ 
      firstName, lastName, email, phoneNumber, _id, addresses 
    });

    next(response);
  } catch (error) {
    console.error('[AuthController] updateProfile - Error:', error);
    next(error);
  }
};

export const googleSignIn = async (req: Request, res: Response, next: NextFunction) => {
  const { code } = req.body;
  const response = await authService.googleLogin(code);

  next(response);
}

export const sendInfluencerEmail = async (req: Request, res: Response, next: NextFunction) => {
  const { influencerName, email, youtubePageName, instagramPageName, subscribers, followers } = req.body;

  const response = await authService.sendInfluencerEmail({ influencerName, email, youtubePageName, instagramPageName, subscribers, followers });

  next(response);
};

export const getUserById = async (req:Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const response = await authService.getUserById(id);

  next(response);
}