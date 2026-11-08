import SteamBadgeUnlocker = require('../index');

/** @internal The members `classes/CCommunityLeader.js` adds to `SteamBadgeUnlocker`; use them on a `SteamBadgeUnlocker` instance. */
export interface CCommunityLeaderMethods {
	/**
	 * Creates the quest runner for the Community Leader badge. `options` are merged shallowly over
	 * `resources/OCommunityLeaderDefault`: a passed object option such as `youtubeCookies` replaces the default object.
	 */
	createCommunityLeader(options?: Partial<SteamBadgeUnlocker.CommunityLeaderOptions> | null): SteamBadgeUnlocker.CCommunityLeader;
}
