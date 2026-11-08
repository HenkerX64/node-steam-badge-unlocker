import SteamBadgeUnlocker = require('../index');

/** @internal The members `components/badges.js` adds to `SteamBadgeUnlocker`; use them on a `SteamBadgeUnlocker` instance. */
export interface BadgesMethods {
	/** Quest progress through `IPlayerService/GetCommunityBadgeProgress`; needs a Web API key. */
	getCommunityBadgeProgress(apiKey: string, badgeId?: number): Promise<SteamBadgeUnlocker.BadgeProgressResponse>;
	/** Features a badge on the profile (quest FeatureBadgeOnProfile). */
	setFavoriteBadge(badgeId: number, isCommunityItem?: boolean): Promise<boolean>;
	/** Crafts a game badge from a full set of trading cards (quest CraftGameBadge). */
	craftBadge(appId: number, borderColor?: 0 | 1, levels?: number): Promise<SteamBadgeUnlocker.CraftBadgeResponse>;
	/** App ids whose badges are marked ready to craft. */
	getAppIdsReadyForCrafting(pageNumber?: number): Promise<number[]>;
	/** Quest progress parsed from `<profile>/badges/<badgeId>`; works without a Web API key. */
	getCommunityBadgeProgressFromProfile(badgeId?: number): Promise<SteamBadgeUnlocker.BadgeProgressResponse>;
}
