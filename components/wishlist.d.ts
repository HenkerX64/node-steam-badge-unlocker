import SteamBadgeUnlocker = require('../index');

/** @internal The members `components/wishlist.js` adds to `SteamBadgeUnlocker`; use them on a `SteamBadgeUnlocker` instance. */
export interface WishlistMethods {
	/** Sets the store `snr` navigation cookie for the wishlist requests. */
	makeNavCookie(snr: string, url: string): void;
	/** Adds or removes a wishlist entry. */
	modifyWishlist(navRef: string, appId: number, remove: boolean): Promise<SteamBadgeUnlocker.WishlistResponse>;
	/** Adds an app to the wishlist (quest AddItemToWishlist). */
	addToWishlist(appId: number, navRef?: string): Promise<SteamBadgeUnlocker.WishlistResponse>;
	/** Removes an app from the wishlist. */
	removeFromWishlist(appId: number, navRef?: string): Promise<SteamBadgeUnlocker.WishlistResponse>;
}
