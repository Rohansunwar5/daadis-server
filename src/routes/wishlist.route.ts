import { Router } from "express";
import { asyncHandler } from "../utils/asynchandler";
import { addItemToWishlist, checkItemInWishlist, clearWishlist, createWishlist, getWishlist, getWishlistItemCount, moveAllItemsToCart, moveItemToCart, removeItemFromWishlist, toggleWishlistItem, updateItemPrice, updateWishlist } from "../controllers/wishlist.controller";
import isLoggedIn from "../middlewares/isLoggedIn.middleware";

const wishlistRouter = Router();

wishlistRouter.post('/create', isLoggedIn, asyncHandler(createWishlist));
wishlistRouter.get('/', isLoggedIn, asyncHandler(getWishlist));
wishlistRouter.get('/count', isLoggedIn, asyncHandler(getWishlistItemCount));
wishlistRouter.post('/add', isLoggedIn, asyncHandler(addItemToWishlist));
wishlistRouter.delete('/remove/:productId', isLoggedIn, asyncHandler(removeItemFromWishlist));
wishlistRouter.put('/update', isLoggedIn, asyncHandler(updateWishlist));
wishlistRouter.delete('/clear', isLoggedIn, asyncHandler(clearWishlist));
wishlistRouter.get('/check/:productId', isLoggedIn, asyncHandler(checkItemInWishlist));
wishlistRouter.post('/toggle', isLoggedIn, asyncHandler(toggleWishlistItem));
wishlistRouter.put('/update-price/:productId', isLoggedIn, asyncHandler(updateItemPrice))
wishlistRouter.post('/move-to-cart/:productId', isLoggedIn, asyncHandler(moveItemToCart));
wishlistRouter.post('/move-all-to-cart', asyncHandler(moveAllItemsToCart))

export default wishlistRouter;