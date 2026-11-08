import SteamBadgeUnlocker = require('../index');

/** @internal The members `components/guides.js` adds to `SteamBadgeUnlocker`; use them on a `SteamBadgeUnlocker` instance. */
export interface GuidesMethods {
	/** Trending guides. */
	getGuidesTrendLinks(params?: SteamBadgeUnlocker.ContentQueryParams): Promise<SteamBadgeUnlocker.GuideLink[]>;
}
