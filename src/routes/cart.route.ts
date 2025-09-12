import { Router } from 'express';
import { asyncHandler } from '../utils/asynchandler';
import { 
  addItemToCart,
  addItemToGuestCart,
  addItemUniversal,
  applyDiscount,
  clearCartItems,
  deleteCart,
  getCart,
  getCartWithDetails,
  getGuestCart,
  getUniversalCart,
  removeDiscount,
  removeItemFromCart,
  updateCartItem
} from '../controllers/cart.controller';
import isLoggedIn from '../middlewares/isLoggedIn.middleware';

const cartRouter = Router();

cartRouter.get('/', isLoggedIn, asyncHandler(getCart));
cartRouter.post('/', isLoggedIn, asyncHandler(addItemToCart));

// Move specific routes BEFORE parameterized routes
cartRouter.post('/apply-discount', isLoggedIn, asyncHandler(applyDiscount));
cartRouter.delete('/remove-discount', isLoggedIn, asyncHandler(removeDiscount));
cartRouter.get('/details', isLoggedIn, asyncHandler(getCartWithDetails));
cartRouter.delete('/clear', isLoggedIn, asyncHandler(clearCartItems));

// Parameterized routes should come AFTER specific routes
cartRouter.put('/:itemId', isLoggedIn, asyncHandler(updateCartItem));
cartRouter.delete('/:itemId', isLoggedIn, asyncHandler(removeItemFromCart));

cartRouter.delete('/', isLoggedIn, asyncHandler(deleteCart));
cartRouter.get('/guest/:sessionId', asyncHandler(getGuestCart));
cartRouter.post('/guest/:sessionId', asyncHandler(addItemToGuestCart));
cartRouter.post('/validate', asyncHandler(getGuestCart));
cartRouter.post('/merge', isLoggedIn, asyncHandler(addItemToGuestCart));
cartRouter.get('/universal', asyncHandler(getUniversalCart));
cartRouter.post('/universal', asyncHandler(addItemUniversal));

export default cartRouter;
