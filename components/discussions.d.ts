import SteamBadgeUnlocker = require('../index');

/** @internal The members `components/discussions.js` adds to `SteamBadgeUnlocker`; use them on a `SteamBadgeUnlocker` instance. */
export interface DiscussionsMethods {
	/** Searches the discussions (quest SearchInDiscussions). */
	discussionsSearch(query: string): Promise<string>;
}
