import SteamBadgeUnlocker = require('../index');

/** @internal The members `components/workshop.js` adds to `SteamBadgeUnlocker`; use them on a `SteamBadgeUnlocker` instance. */
export interface WorkshopMethods {
	/** Trending Workshop items. */
	getWorkshopTrendLinks(params?: SteamBadgeUnlocker.ContentQueryParams): Promise<SteamBadgeUnlocker.WorkshopLink[]>;
	/**
	 * Uploads a screenshot (quest PostScreenshot), private unless `visibility` is another
	 * `EPublishedFileVisibility` value. Rejects with
	 * `MISSING_TOKEN_FIELD`, `MISSING_WG_FIELD` or `MISSING_FORM_ACTION` when the upload form cannot be read,
	 * `SCREENSHOT_UPLOAD_FAILED`, or the stream error of an unreadable file.
	 */
	uploadScreenshot(appId: number, title: string, description: string, file: SteamBadgeUnlocker.ReadableLike, visibility?: SteamBadgeUnlocker.EPublishedFileVisibility): Promise<{success: true, id: string}>;
}
