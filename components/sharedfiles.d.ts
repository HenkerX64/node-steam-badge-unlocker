import SteamBadgeUnlocker = require('../index');

/** @internal The members `components/sharedfiles.js` adds to `SteamBadgeUnlocker`; use them on a `SteamBadgeUnlocker` instance. */
export interface SharedfilesMethods {
	/** Subscribes to a Workshop item (quest SubscribeToWorkshopItem). */
	subscribeToSharedFile(fileId: string, appId: string | number): Promise<true>;
	/** Unsubscribes from a Workshop item (cleanup of quest SubscribeToWorkshopItem). */
	unsubscribeFromSharedFile(fileId: string, appId: string | number): Promise<true>;
	/** Loads a shared file page; with the overlay user agent it counts as an overlay view (quest ViewGuideInOverlay). */
	getSharedFileDetails(fileId: string | number, params?: {qs?: Record<string, string | number>, headers?: Record<string, string>}): Promise<string>;
	/** Votes on a shared file (quests RateWorkshopItem, RateUpContentInActivityFeed). */
	voteSharedFile(fileId: string, up?: boolean): Promise<true>;
	/** Deletes an own shared file; `appId` defaults to `0` and `fileType` to `'videos'`, so pass `'screenshots'` for a screenshot. Rejects with `REJECTED_SHARED_FILE_DELETE`. */
	deleteSharedFile(fileId: string, appId?: number, fileType?: SteamBadgeUnlocker.EFileTypeType): Promise<true>;
	/**
	 * Comments on a shared file and resolves with the comment id. Rejects with `MISSING_FILE_OWNER_STEAM_ID` or
	 * `MISSING_FILE_ID` without the ids, `REJECTED_COMMENT_POST` with Steam's text as message, `ON_SUCCESS_ID_NOT_FOUND`
	 * or `UNKNOWN_COMMENT_POST`.
	 */
	postSharedFileComment(steamId: string, fileId: string, comment: string, count?: number): Promise<string>;
	/** Deletes a shared file comment and checks that it is gone; rejects with `REJECTED_COMMENT_DELETE` or `UNKNOWN_COMMENT_DELETE`. */
	deleteSharedFileComment(steamId: string, fileId: string, commentId: string, count?: number): Promise<true>;
}
