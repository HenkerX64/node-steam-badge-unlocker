import SteamBadgeUnlocker = require('../index');

/** @internal The members `components/profile.js` adds to `SteamBadgeUnlocker`; use them on a `SteamBadgeUnlocker` instance. */
export interface ProfileMethods {
	/** Sets the real name with `steamcommunity`'s `editProfile` (quest SetupCommunityRealName); its requests send `Accept-Language`. */
	setRealName(realName: string): Promise<true>;
	/** Selects an official game avatar (quest SetupCommunityAvatar). */
	selectAvatar(appId: number, selectedAvatar?: number): Promise<true>;
	/** Sets a profile background through `IPlayerService` with the store `webapi_token` (quest SetProfileBackground). */
	setProfileBackground(itemId: string | number): Promise<{response: object}>;
	/** Profile items owned by the account, through `IPlayerService` with the store `webapi_token`. */
	getOwnedProfileItems(): Promise<{response: SteamBadgeUnlocker.OwnedProfileItems}>;
	/** Logs an activity-feed upvote; resolves with the string `'null'`. */
	logFriendActivityUpvote(): Promise<'null'>;
	/** One page of the activity feed. */
	getUserNews(start?: number | null): Promise<SteamBadgeUnlocker.UserNewsResponse>;
	/** Friend posts from the activity feed that accept votes. */
	getLastFriendPosts(minPosts?: number): Promise<SteamBadgeUnlocker.CommentActionParams[]>;
	/** Votes on an activity-feed post. */
	voteContent(params: SteamBadgeUnlocker.CommentActionParams & {action: SteamBadgeUnlocker.CommentActionType}): Promise<SteamBadgeUnlocker.SharedFilesActivity>;
	/** Posts a review that is not public, comments disabled (quest RecommendGame). */
	addGameRecommendation(appId: number, comment: string, rateUp?: boolean): Promise<{success: boolean, strError?: string}>;
	/** Deletes the review of an app. */
	deleteGameRecommendation(appId: number): Promise<string | object>;
}
