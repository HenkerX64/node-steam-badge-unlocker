import SteamBadgeUnlocker = require('../index');

/** @internal The members `components/broadcast.js` adds to `SteamBadgeUnlocker`; use them on a `SteamBadgeUnlocker` instance. */
export interface BroadcastMethods {
	/** Requests a broadcast manifest; `success === 'ready'` counts as watching (quest ViewBroadcast). */
	getBroadcastManifest(steamId: string): Promise<SteamBadgeUnlocker.BroadcastMpd>;
	/** Trending live broadcasts. */
	getBroadcastTrendLinks(params?: SteamBadgeUnlocker.ContentQueryParams): Promise<SteamBadgeUnlocker.BroadcastLink[]>;
}
