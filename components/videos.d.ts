import SteamBadgeUnlocker = require('../index');

/** @internal The members `components/videos.js` adds to `SteamBadgeUnlocker`; use them on a `SteamBadgeUnlocker` instance. */
export interface VideosMethods {
	/** Videos shared on the profile. */
	getProfileVideos(params?: {qs?: object}): Promise<SteamBadgeUnlocker.ProfileVideo[]>;
	/** YouTube videos available for sharing; needs `setYoutubeCookies` first. */
	fetchYoutubeVideos(): Promise<Array<{youtubeId: string}>>;
	/** Shares YouTube videos on the profile and resolves with the number added (quest PostVideo); needs `setYoutubeCookies` first. */
	postYoutubeVideo(youtubeIds: string | string[], appId?: number, otherAssoc?: string): Promise<number>;
	/** Sets the YouTube cookies on the `steamcommunity` session; throws `MISSING_YOUTUBE_ACCESS_TOKEN` without `accessToken`. */
	setYoutubeCookies(cookies: SteamBadgeUnlocker.YoutubeCookies): void;
}
