import userModel, { IAuthProvider, IUser } from '../models/user.model';

export interface IAddress {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
  isDefault: boolean;
}

export interface IOnBoardUserParams {
  firstName: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  password?: string;
  authProvider?: string;
  verified?: boolean;
}

export class UserRepository {
  private _model = userModel;

  async getUserByEmailId(email: string): Promise<IUser | null> {
    return this._model.findOne({ email });
  }

  async onBoardUser(params: IOnBoardUserParams): Promise<IUser> {
  return this._model.create({
    firstName: params.firstName,
    lastName: params.lastName,
    email: params.email,
    phoneNumber: params.phoneNumber || '',
    password: params.password,
    authProvider: params.authProvider || IAuthProvider.EMAIL,
    verified: params.verified || false,
  });
}
  async getUserById(id: string) {
    return this._model.findById(id).select(' _id firstName lastName email phoneNumber addresses luckyPoints verified isGuest createdAt updatedAt __v');
  }

async updateUser(params: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  _id: string;
  addresses?: Array<{
    name?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    country?: string;
    isDefault?: boolean;
  }>;
}) {
  const { firstName, lastName, email, phoneNumber, _id, addresses } = params;

  return this._model.findByIdAndUpdate(
      _id,
      { firstName, lastName, email, phoneNumber, addresses },
      { new: true }
    );
  }
  
  async verifyUserId(userId: string) {
    return this._model.findByIdAndUpdate(userId, {
      verified: true
    }, { new: true });
  }

  async updateUserPoints(userId: string, points: number): Promise<IUser | null> {
    return this._model.findByIdAndUpdate(
      userId, 
      { $inc: { luckyPoints: points } }, 
      { new: true }
    );
  }
}