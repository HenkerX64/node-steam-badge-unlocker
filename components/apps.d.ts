import SteamBadgeUnlocker = require('../index');

/** @internal The members `components/apps.js` adds to `SteamBadgeUnlocker`; use them on a `SteamBadgeUnlocker` instance. */
export interface AppsMethods {
	/** Removes one app from the discovery queue. */
	clearDiscoveryQueueAppId(appId: number, queueAppId?: number): Promise<string>;
	/** Creates a new discovery queue. */
	generateNewDiscoveryQueue(eQueueType?: number): Promise<SteamBadgeUnlocker.DiscoveryQueueResult>;
	/**
	 * Creates a discovery queue and clears every app in it (quest UseDiscoveryQueue). Resolves the settled result per
	 * app; on Node.js before 12.9 the plain results instead, and it rejects with the first failed app.
	 */
	finishDiscoveryQueue(): Promise<Array<{status: 'fulfilled', value: string} | {status: 'rejected', reason: unknown}> | string[]>;
	/** Loads one page of `https://steamcommunity.com/apps/allcontenthome/`. */
	getAllContentHome(subSection: SteamBadgeUnlocker.ESubSectionType, params?: SteamBadgeUnlocker.ContentQueryParams): Promise<string>;
}
