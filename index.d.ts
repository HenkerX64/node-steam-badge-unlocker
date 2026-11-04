import ECommunityBadgeQuestsValues = require('./resources/ECommunityBadgeQuests');
import EErrorCodeValues = require('./resources/EErrorCode');
import EFileTypeValues = require('./resources/EFileType');
import EPublishedFileVisibilityValues = require('./resources/EPublishedFileVisibility');
import ESubSectionValues = require('./resources/ESubSection');
import Helpers = require('./components/helpers');

/**
 * Completes the quests of the Steam Community Leader badge (badge 2) for bot accounts. Works on your logged-in
 * `steamcommunity` instance and, for PlayGame and UseEmoticonInChat only, a logged-in `steam-user` client of the
 * same account (passed as the `steamUser` option; the package never requires `steam-user` itself).
 *
 * Versions: `steamcommunity` `>=3.43.1` (peer dependency), tested with 3.50.3; every version from 3.43.1 has the
 * `onPreHttpRequest` hook the package uses. The package also requires the internal path
 * `steamcommunity/components/helpers`, so a release that moves it breaks the package. `steam-user` `>=5.0.0`
 * (optional peer dependency). Node.js `>=10` for the package; `steam-user` 5 itself needs Node.js `>=14`.
 *
 * Adds what `steamcommunity` and `steam-user` do not have: quest progress (`getCommunityBadgeProgress`,
 * `getCommunityBadgeProgressFromProfile`), official game avatars (`selectAvatar`; steamcommunity only uploads images),
 * screenshot upload (`uploadScreenshot`), YouTube video sharing (`postYoutubeVideo`), badge crafting (`craftBadge`),
 * the discovery queue (`finishDiscoveryQueue`), the wishlist (`addToWishlist`), Workshop subscriptions and votes
 * (`subscribeToSharedFile`, `voteSharedFile`), profile backgrounds over the web session (`setProfileBackground`)
 * and the quest runner `createCommunityLeader`.
 *
 * Minimal use, after the web session of `community` is set (`community.setCookies(cookies)`):
 * ```js
 * const SteamBadgeUnlocker = require('steam-badge-unlocker');
 * const leader = new SteamBadgeUnlocker(community).createCommunityLeader({
 *     masterInstance, steamUser, forceAddFriend: true, forceRemoveFriend: true,
 * });
 * await leader.start().catch(console.error);
 * await leader.finish();
 * ```
 * Which quests need what: `SteamBadgeUnlocker.CCommunityLeader`. Options and defaults:
 * `SteamBadgeUnlocker.CommunityLeaderOptions`. Error codes: `SteamBadgeUnlocker.EErrorCode`.
 *
 * Do not use it when
 * - the account must not show test content: the quests post and delete comments, a status, a screenshot, a video
 *   and a review, add and remove a wishlist entry, subscribe to and unsubscribe from a Workshop item, join and leave
 *   a group, and set and clear the real name;
 * - changes must not stay: the avatar, the profile background, the featured badge, the Workshop
 *   vote, the votes on the friend's screenshot and feed post, the chat message, the friend (unless
 *   `forceRemoveFriend`) and the free license of `playAppId` stay; CraftGameBadge uses up a set of trading cards;
 *   with steamcommunity 3.43–3.47 `getWebApiKey` registers a Web API key for `localhost` when the account has none;
 * - you need the market, phone, two-factor or Steam Guard quests or Trade: they are not automated;
 * - the `steamcommunity` instance must stay untouched: PostVideo and the wishlist set cookies on it, and while
 *   `getWebApiKey` or `setRealName` (SetupCommunityRealName) runs every request of the instance gets the
 *   `Accept-Language` header.
 *
 * Everything declared in these `.d.ts` files is public API under semver, also the helpers of
 * `require('steam-badge-unlocker/components/helpers')` and the enums of `resources/`; the exceptions are
 * `withMissingRequiredHeaders`, a temporary workaround that is removed once steamcommunity sends the header itself,
 * and the test helpers `isSteamId` and `parseConfigString`.
 * Members starting with `_` are private and not declared.
 */
declare class SteamBadgeUnlocker {
	/**
	 * Reads `steamID` and the session id of `community` once, so create it after the web session is set and
	 * again after a new login. Throws `MISSING_COMMUNITY` when `community` is `undefined`, `null` or an object
	 * without `getSessionID`.
	 * @param community logged-in `steamcommunity` instance
	 * @param options Web API key and store `webapi_token`, read from Steam on first use when not set; custom profile
	 *   URL name, which `leader.start()` also sets from the account
	 */
	constructor(community: SteamBadgeUnlocker.SteamCommunityLike, options?: SteamBadgeUnlocker.UnlockerOptions | null);

	/** Language of the requests; always `'english'`. */
	getLanguage(): string;
	/** SteamID64 of the logged-in account. */
	getSteamId(): string;
	/** `https://steamcommunity.com/profiles/<id>` or the custom URL. */
	getProfileUrl(): string;
	/** Switches the profile URL to `https://steamcommunity.com/id/<customUrl>` and returns it. */
	setCustomProfileUrl(customUrl: string): string;
	/** Session id of the web session. */
	getSessionId(): string;
	/** The `steamcommunity` instance passed to the constructor. */
	getCommunity(): SteamBadgeUnlocker.SteamCommunityLike;
	/**
	 * GET through `steamcommunity.httpRequest` with the session of `community`; resolves with the response body,
	 * rejects with the steamcommunity error, no retries. Usable for your own Steam requests; overwrites `params.method`.
	 */
	get(params: SteamBadgeUnlocker.RequestParams): Promise<string | object>;
	/**
	 * POST through `steamcommunity.httpRequest` with the session of `community`; resolves with the response body,
	 * rejects with the steamcommunity error, no retries. Usable for your own Steam requests; overwrites `params.method`.
	 */
	post(params: SteamBadgeUnlocker.RequestParams): Promise<string | object>;
	/**
	 * Web API key of the account through `steamcommunity.getWebApiKey('localhost')`, read once. steamcommunity 3.48
	 * and later only read an existing key; 3.43–3.47 register one for `localhost` when the account has none. The
	 * first call rejects with the steamcommunity error when there is no key; later calls resolve `''`.
	 * Its request sends `Accept-Language`.
	 */
	getWebApiKey(): Promise<string>;
	/** Store `webapi_token` from the points shop page, read once. The first call rejects with `NOT_FOUND_WEBAPI_TOKEN` when the page fails to load or has none; later calls resolve `''`. */
	getWebApiToken(): Promise<string>;

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

	/** Requests a broadcast manifest; `success === 'ready'` counts as watching (quest ViewBroadcast). */
	getBroadcastManifest(steamId: string): Promise<SteamBadgeUnlocker.BroadcastMpd>;
	/** Trending live broadcasts. */
	getBroadcastTrendLinks(params?: SteamBadgeUnlocker.ContentQueryParams): Promise<SteamBadgeUnlocker.BroadcastLink[]>;
	/** Searches the discussions (quest SearchInDiscussions). */
	discussionsSearch(query: string): Promise<string>;
	/** Trending guides. */
	getGuidesTrendLinks(params?: SteamBadgeUnlocker.ContentQueryParams): Promise<SteamBadgeUnlocker.GuideLink[]>;

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

	/** Videos shared on the profile. */
	getProfileVideos(params?: {qs?: object}): Promise<SteamBadgeUnlocker.ProfileVideo[]>;
	/** YouTube videos available for sharing; needs `setYoutubeCookies` first. */
	fetchYoutubeVideos(): Promise<Array<{youtubeId: string}>>;
	/** Shares YouTube videos on the profile and resolves with the number added (quest PostVideo); needs `setYoutubeCookies` first. */
	postYoutubeVideo(youtubeIds: string | string[], appId?: number, otherAssoc?: string): Promise<number>;
	/** Sets the YouTube cookies on the `steamcommunity` session; throws `MISSING_YOUTUBE_ACCESS_TOKEN` without `accessToken`. */
	setYoutubeCookies(cookies: SteamBadgeUnlocker.YoutubeCookies): void;

	/** Sets the store `snr` navigation cookie for the wishlist requests. */
	makeNavCookie(snr: string, url: string): void;
	/** Adds or removes a wishlist entry. */
	modifyWishlist(navRef: string, appId: number, remove: boolean): Promise<SteamBadgeUnlocker.WishlistResponse>;
	/** Adds an app to the wishlist (quest AddItemToWishlist). */
	addToWishlist(appId: number, navRef?: string): Promise<SteamBadgeUnlocker.WishlistResponse>;
	/** Removes an app from the wishlist. */
	removeFromWishlist(appId: number, navRef?: string): Promise<SteamBadgeUnlocker.WishlistResponse>;

	/** Trending Workshop items. */
	getWorkshopTrendLinks(params?: SteamBadgeUnlocker.ContentQueryParams): Promise<SteamBadgeUnlocker.WorkshopLink[]>;
	/**
	 * Uploads a screenshot (quest PostScreenshot), private unless `visibility` is another
	 * `EPublishedFileVisibility` value. Rejects with
	 * `MISSING_TOKEN_FIELD`, `MISSING_WG_FIELD` or `MISSING_FORM_ACTION` when the upload form cannot be read,
	 * `SCREENSHOT_UPLOAD_FAILED`, or the stream error of an unreadable file.
	 */
	uploadScreenshot(appId: number, title: string, description: string, file: SteamBadgeUnlocker.ReadableLike, visibility?: SteamBadgeUnlocker.EPublishedFileVisibility): Promise<{success: true, id: string}>;

	/**
	 * Creates the quest runner for the Community Leader badge. `options` are merged shallowly over
	 * `resources/OCommunityLeaderDefault`: a passed object option such as `youtubeCookies` replaces the default object.
	 */
	createCommunityLeader(options?: Partial<SteamBadgeUnlocker.CommunityLeaderOptions> | null): SteamBadgeUnlocker.CCommunityLeader;
}

declare namespace SteamBadgeUnlocker {
	export const ECommunityBadgeQuests: typeof ECommunityBadgeQuestsValues;
	export const EErrorCode: typeof EErrorCodeValues;
	export const EFileType: typeof EFileTypeValues;
	export const EPublishedFileVisibility: typeof EPublishedFileVisibilityValues;
	export const ESubSection: typeof ESubSectionValues;

	export type ErrorCode = Helpers.ErrorCode;
	export type CommentType = Helpers.CommentType;
	export type CommentActionType = Helpers.CommentActionType;
	export type CommentActionParams = Helpers.CommentActionParams;
	export type EFileTypeType = Extract<keyof typeof EFileTypeValues, string>;
	export type EPublishedFileVisibility = (typeof EPublishedFileVisibilityValues)[Extract<keyof typeof EPublishedFileVisibilityValues, string>];
	export type ESubSectionType = Extract<keyof typeof ESubSectionValues, string>;

	/** The members of a `steamcommunity` instance this package uses; parameters stay open so that any version fits. */
	export interface SteamCommunityLike {
		steamID: {toString(): string} | null;
		getSessionID(...args: any[]): any;
		httpRequest(...args: any[]): any;
		httpRequestGet(...args: any[]): any;
		setCookies(...args: any[]): any;
		getWebApiKey(...args: any[]): any;
		getSteamUser(...args: any[]): any;
		addFriend(...args: any[]): any;
		removeFriend(...args: any[]): any;
		joinGroup(...args: any[]): any;
		leaveGroup(...args: any[]): any;
		postUserComment(...args: any[]): any;
		deleteUserComment(...args: any[]): any;
		postProfileStatus(...args: any[]): any;
		deleteProfileStatus(...args: any[]): any;
		editProfile(...args: any[]): any;
		onPreHttpRequest?(requestId: number, source: string, options: RequestParams, continueRequest: (error?: Error | null) => void): boolean | void;
	}

	/** The members of a `steam-user` client this package uses (PlayGame, UseEmoticonInChat). */
	export interface SteamUserLike {
		requestFreeLicense(...args: any[]): any;
		gamesPlayed(...args: any[]): any;
		chat: {
			sendFriendMessage(...args: any[]): any;
		};
	}

	export interface UnlockerOptions {
		apiKey?: string;
		apiToken?: string;
		customUrl?: string;
	}

	/** Options of `createCommunityLeader`; defaults: `resources/OCommunityLeaderDefault.js`. */
	export interface CommunityLeaderOptions {
		/** Friend of the friend quests; `init()` sets the master's SteamID when it is empty and `masterInstance` is set. Default: `null`. */
		friendSteamId: string | null;
		/** `finish()` removes `friendSteamId` from the friends list. Default: `false`. */
		forceRemoveFriend: boolean;
		/** `start()` runs AddFriendToFriendsList before the other friend quests, even when the quest is completed, as long as any quest is open; set it with `masterInstance`, because the other friend quests need the friendship. Default: `false`. */
		forceAddFriend: boolean;
		/** Reads the quest progress through the Web API when `getWebApiKey()` finds a key, otherwise from the badge page. Default: `true`. */
		fetchBadgesWithApiKey: boolean;
		/** AddItemToWishlist: app to add and remove again. Default: `1195460`. */
		wishlistAppId: number;
		/** CraftGameBadge: app to craft; `null` takes the first badge ready to craft. Default: `null`. */
		craftGameBadgeAppId: number | null;
		/** FeatureBadgeOnProfile: badge to feature. Default: `2`. */
		featureBadgeId: number;
		/** JoinGroup: group to join. Default: `"103582791434672565"`. */
		joinGroupId: string;
		/** JoinGroup: leave the group again. Default: `true`. */
		leaveGroupAutomatically: boolean;
		/** PostCommentOnFriendsPage: comment text. Default: `"test"`. */
		friendsPageComment: string;
		/** PostCommentOnFriendsScreenshot: comment text. Default: `"test"`. */
		friendsScreenshotComment: string;
		/** Friend's screenshot of PostCommentOnFriendsScreenshot and RateUpContentInActivityFeed; `init()` reads the master's newest screenshot when `null` and the friend is the master. Default: `null`. */
		friendsScreenshotFileId: string | null;
		/** PostStatusToFriends: status text. Default: `"test"`. */
		statusText: string;
		/** PostStatusToFriends: app the status refers to. Default: `0`. */
		statusAppId: number;
		/** PostScreenshot: app of the screenshot. Default: `767`. */
		screenshotAppId: number;
		/** PostScreenshot: title. Default: `"test"`. */
		screenshotTitle: string;
		/** PostScreenshot: description. Default: `""`. */
		screenshotDescription: string;
		/** PostScreenshot: path of the image file. Default: `resources/empty.png`. */
		screenshotPath: string;
		/** PostVideo: YouTube video id; `null` takes the first available video. Default: `null`. */
		youtubeId: string | null;
		/**
		 * PostVideo: cookies of the linked YouTube account. Leave it unset to turn PostVideo off: without `accessToken`
		 * it is skipped before any request, resolves `false` and logs `SKIP_MISSING_YOUTUBE_ACCESS_TOKEN`; the run continues.
		 * Default: `{"accessToken":null,"authAccount":"","refreshToken":"null"}`.
		 */
		youtubeCookies: YoutubeCookies;
		/** SubscribeToWorkshopItem, RateWorkshopItem: Workshop item. Default: `"308490450"`. */
		workshopFileId: string;
		/** SubscribeToWorkshopItem: app of the Workshop item. Default: `730`. */
		workshopAppId: number;
		/** RecommendGame: app to review. Default: `730`. */
		reviewAppId: number;
		/** RecommendGame: review text. Default: `"Temporary recommendation"`. */
		reviewText: string;
		/** SearchInDiscussions: search term. Default: `"GlobalDiscussionSearchForm"`. */
		discussionsKeyword: string;
		/** SetupCommunityRealName: name to set. Default: `"John"`. */
		realName: string;
		/** SetupCommunityRealName: clear the name again after `resetRealNameAfterSeconds`. Default: `true`. */
		resetRealName: boolean;
		/** SetupCommunityRealName: seconds between setting and clearing the name. Default: `5`. */
		resetRealNameAfterSeconds: number;
		/** SetupCommunityAvatar: app of the official avatar. Default: `582660`. */
		avatarAppId: number;
		/** SetupCommunityAvatar: index of the avatar in the app's avatar list. Default: `4`. */
		avatarIndex: number;
		/** ViewBroadcast: SteamID of the broadcaster; `null` takes a trending broadcast. Default: `null`. */
		broadcastWatchId: string | null;
		/** ViewGuideInOverlay: guide to view; `null` takes a trending guide. Default: `143430756`. */
		guideFileId: string | number | null;
		/** ViewGuideInOverlay: user agent of the Steam overlay browser. Default: `"Mozilla/5.0 (Windows; U; Windows NT 10.0; en-US; Valve Steam GameOverlay/1639697812; ) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36"`. */
		steamOverlayUserAgent: string;
		/** PlayGame: app to play. Default: `730`. */
		playAppId: number;
		/** PlayGame: seconds the game runs; PlayGame resolves after them. Default: `330`. */
		playSeconds: number;
		/** UseEmoticonInChat: chat message with the emoticon. Default: `":steamthumbsup:"`. */
		emotionMessageText: string;
		/** PlayGame, UseEmoticonInChat: logged-in `steam-user` client; without it both quests are skipped with `SKIP_MISSING_STEAM_USER`. Default: `null`. */
		steamUser: SteamUserLike | null;
		/** Logger `(key, value)`; `null` logs to the console with date and SteamID. Default: `null`. */
		log: ((key: string, value: unknown) => void) | null;
		/** Logged-in `steamcommunity` instance of the master account: friend and screenshot for the friend quests, and the friend invite; one master serves several leaders, its newest screenshot is read once per process. Default: `null`. */
		masterInstance: SteamCommunityLike | null;
	}

	/**
	 * Quest runner returned by `createCommunityLeader`. Each automated quest method resolves `true` when its requests
	 * succeeded and `false` otherwise. `getLastError()` holds the error when a request failed or the quest was
	 * skipped, and `null` when the quest just did not succeed (nothing to do, or Steam's answer was not a success).
	 * `true` does not mean that Steam counted the quest: `start()` logs the open quests again at the end. A cleanup
	 * request that fails (deleting a comment, the status, screenshot, video or review, removing the wishlist entry,
	 * leaving the group, clearing the real name) is not logged, so the content can stay. BuyOrSellOnMarket and the three manual quests resolve `null`.
	 *
	 * The package does no pacing between requests or accounts. Steam answers bursts with HTTP 429, which shows up as
	 * the code `429` in the log and in `getLastError()`; give each account its own `steamcommunity` instance.
	 *
	 * Not automated, 5 of the 28 quests: BuyOrSellOnMarket (trading for a quest goes against the Steam ToS),
	 * AddTwoFactorToAccount, AddPhoneToAccount and SetupSteamGuard (they change the account security and need the
	 * owner's phone; do them by hand, they count on top), Trade (not implemented). So `start()` completes at most 23.
	 *
	 * What a full account needs, counted with the default options:
	 * - nothing more: 14 quests — JoinGroup, RecommendGame, PostScreenshot, AddItemToWishlist, SetupCommunityAvatar,
	 *   SetupCommunityRealName, RateWorkshopItem, PostStatusToFriends, SubscribeToWorkshopItem, ViewGuideInOverlay,
	 *   SearchInDiscussions, FeatureBadgeOnProfile, UseDiscoveryQueue, ViewBroadcast;
	 * - a friend, +4 = 18: `masterInstance` (a second logged-in full account whose newest screenshot is public), or `friendSteamId`
	 *   plus `friendsScreenshotFileId` — AddFriendToFriendsList, PostCommentOnFriendsPage (`start()` runs it only when
	 *   the SetupSteamGuard quest is completed, i.e. Steam Guard is enabled), PostCommentOnFriendsScreenshot,
	 *   RateUpContentInActivityFeed;
	 * - `steamUser`, +2 = 20: PlayGame, and with the friend UseEmoticonInChat;
	 * - optional, +3 = 23: `youtubeCookies` (PostVideo); a full set of trading cards (CraftGameBadge; when it drops a
	 *   background, SetProfileBackground uses it) or an owned profile background (SetProfileBackground).
	 * The counts assume that each quest succeeds with its default target: a live broadcast exists, RecommendGame can
	 * review `reviewAppId` 730 (an account that does not own it may fail; PlayGame adds its free license first), and
	 * FeatureBadgeOnProfile finds badge 2 unlocked, which Steam does after 13 completed quests; without a friend and
	 * `steamUser` a new account usually completes it in a second run.
	 * Limited accounts lose PostCommentOnFriendsScreenshot, RecommendGame and RateWorkshopItem, and without a master
	 * also AddFriendToFriendsList, because Steam lets limited accounts accept but not send friend invites; VAC-banned
	 * accounts lose RateWorkshopItem. With `steamcommunity` only a limited account completes 11: its other quests
	 * do not reach the 13 that unlock the badge for FeatureBadgeOnProfile.
	 *
	 * Without a friend, AddFriendToFriendsList, PostCommentOnFriendsPage, PostCommentOnFriendsScreenshot and
	 * UseEmoticonInChat are skipped with `SKIP_MISSING_FRIEND`, and RateUpContentInActivityFeed finds nothing of a
	 * friend to vote. To leave out another quest, replace it on the instance, e.g. `leader.PostVideo = async () => false`;
	 * `start()` calls a replacement with `this` as the leader under the same conditions, and a thrown error is logged
	 * and kept in `getLastError()` like a failed quest.
	 */
	export interface CCommunityLeader {
		/** Defaults merged with the options passed to `createCommunityLeader`. */
		options: CommunityLeaderOptions;
		/** Set by `start()` from `steamcommunity.getSteamUser`. */
		isLimitedAccount: boolean;
		/** Set by `start()` from `steamcommunity.getSteamUser`. */
		vacBanned: boolean;
		/** Set by `start()`; `true` unless the trade ban state is `'None'`. */
		tradeBanState: boolean;
		/** The `log` option, or the console logger. */
		log(key: string, value: unknown): void;
		/** Reads friend and screenshot from `masterInstance`; called by `start()`. */
		init(): Promise<void>;
		/**
		 * Reads the open quests, runs them in a fixed order and logs each as `(questName, 'OK' | error code | result)`,
		 * then logs the open quests again. Calls `finish()` only when no quest was open. Rejects when the badge progress
		 * request fails, before or after the quests; when the page loads but shows no quests it logs
		 * `('error', 'not able to get badge progress')` and treats no quest as open. A failing quest never rejects it.
		 */
		start(): Promise<void>;
		/** Removes the friend when `forceRemoveFriend` is set and resolves `false` when that fails; otherwise resolves `true`. Safe to call after `start()`. */
		finish(): Promise<boolean>;
		/** Error of the last quest call: the request error, or an error with a `SKIP_*` code; `null` when there was none. */
		getLastError(): Error | null;

		/** Quest 101: joins `joinGroupId` and leaves it again with `leaveGroupAutomatically`. */
		JoinGroup(): Promise<boolean>;
		/** Quest 103: comments on the friend's profile and deletes the comment; skipped without a friend; `start()` runs it only when the SetupSteamGuard quest is completed, i.e. Steam Guard is enabled, because Steam allows profile comments only with Steam Guard. */
		PostCommentOnFriendsPage(): Promise<boolean>;
		/** Quest 104: posts a review of `reviewAppId` that is not public and deletes it; the account may need to own the app; `start()` skips it on limited accounts. */
		RecommendGame(): Promise<boolean>;
		/** Quest 105: uploads `screenshotPath` and deletes it. */
		PostScreenshot(): Promise<boolean>;
		/** Quest 106: shares a YouTube video and deletes only the video it added; skipped without `youtubeCookies.accessToken`. */
		PostVideo(): Promise<boolean>;
		/** Quest 108: adds `wishlistAppId` to the wishlist and removes it. */
		AddItemToWishlist(): Promise<boolean>;
		/** Quest 109: comments on `friendsScreenshotFileId` and deletes the comment; skipped without a friend, fails with `MISSING_FILE_ID` without the screenshot; `start()` skips it on limited accounts. */
		PostCommentOnFriendsScreenshot(): Promise<boolean>;
		/** Quest 110: selects avatar `avatarIndex` of `avatarAppId`; the avatar stays. */
		SetupCommunityAvatar(): Promise<boolean>;
		/** Quest 111: sets `realName` with `setRealName` and, with `resetRealName`, clears it again after `resetRealNameAfterSeconds`; the requests send `Accept-Language`. */
		SetupCommunityRealName(): Promise<boolean>;
		/** Quest 112: requests a free license of `playAppId` (it stays), plays it for `playSeconds` and stops; a game that another session of the account plays is stopped; skipped without `steamUser`. */
		PlayGame(): Promise<boolean>;
		/** Quest 113: adds the friend; with `masterInstance` the master invites first and a failed master invite is not logged, otherwise the friend has to accept the invite; the friend stays until `finish()` with `forceRemoveFriend`; skipped without a friend. */
		AddFriendToFriendsList(): Promise<boolean>;
		/** Quest 114: votes up `workshopFileId`; the vote stays; `start()` skips it on limited and VAC-banned accounts. */
		RateWorkshopItem(): Promise<boolean>;
		/** Quest 117: posts `statusText` and deletes it. */
		PostStatusToFriends(): Promise<boolean>;
		/** Quest 118: votes up `friendsScreenshotFileId` and a friend post of the activity feed; resolves `true` even when nothing was voted. */
		RateUpContentInActivityFeed(): Promise<boolean>;
		/** Quest 119: subscribes to `workshopFileId` and unsubscribes again; a failed unsubscribe keeps the result. */
		SubscribeToWorkshopItem(): Promise<boolean>;
		/** Quest 121: opens `guideFileId` or a trending guide with the Steam overlay user agent. */
		ViewGuideInOverlay(): Promise<boolean>;
		/** Quest 122: not implemented; resolves `false`; `start()` calls it unless the account is limited or trade-banned. */
		Trade(): Promise<boolean>;
		/** Quest 123: searches the discussions for `discussionsKeyword`. */
		SearchInDiscussions(): Promise<boolean>;
		/** Quest 124: crafts `craftGameBadgeAppId` or the first badge ready to craft, using up a full set of trading cards; resolves `false` when `craftGameBadgeAppId` is `null` and no badge is ready. */
		CraftGameBadge(): Promise<boolean>;
		/** Quest 125: sends `emotionMessageText` to the friend through `steamUser`; skipped with `SKIP_MISSING_FRIEND` without a friend, else with `SKIP_MISSING_STEAM_USER` without `steamUser`. */
		UseEmoticonInChat(): Promise<boolean>;
		/** Quest 126: sets the background CraftGameBadge dropped, if it dropped one, otherwise the first owned background; it stays; resolves `false` without one. */
		SetProfileBackground(): Promise<boolean>;
		/** Quest 127: features `featureBadgeId` on the profile; it stays; resolves `false` while the badge is not unlocked (badge 2 needs 13 completed quests). */
		FeatureBadgeOnProfile(): Promise<boolean>;
		/** Quest 132: creates a discovery queue and clears every app in it; resolves `true` even when clearing apps failed (Node.js 12.9 and later). */
		UseDiscoveryQueue(): Promise<boolean>;
		/** Quest 133: requests the manifest of `broadcastWatchId` or a trending broadcast. */
		ViewBroadcast(): Promise<boolean>;
		/** Quest 120, not automated: trading on the market for a quest goes against the Steam ToS; resolves `null`; `start()` does not call it. */
		BuyOrSellOnMarket(): Promise<null>;
		/** Quest 134, manual: set up the Steam Mobile Authenticator; resolves `null`; `start()` does not call it. */
		AddTwoFactorToAccount(): Promise<null>;
		/** Quest 128, manual: add a phone number to the account; resolves `null`; `start()` does not call it. */
		AddPhoneToAccount(): Promise<null>;
		/** Quest 115, manual: enable Steam Guard; resolves `null`; `start()` does not call it. */
		SetupSteamGuard(): Promise<null>;
	}

	/** Request options of `get` / `post`, passed to `steamcommunity.httpRequest`. */
	export interface RequestParams {
		uri?: string | object;
		url?: string | object;
		baseUrl?: string;
		json?: boolean;
		headers?: Record<string, string>;
		multipart?: object | object[];
		form?: object;
		formData?: object;
		method?: string;
		body?: string;
		jar?: boolean;
		preambleCRLF?: boolean;
		postambleCRLF?: boolean;
		qs?: object;
		oauth?: object;
		agentOptions?: object;
		har?: object;
		time?: boolean;
		timeout?: number;
		followRedirect?: boolean;
		followAllRedirects?: boolean;
		followOriginalHttpMethod?: boolean;
		maxRedirects?: number;
		removeRefererHeader?: boolean;
	}

	/** A readable stream such as `fs.createReadStream(path)`. */
	export interface ReadableLike {
		pipe(destination: any, options?: any): any;
		once?(event: 'error', listener: (error: Error) => void): any;
		destroy?(): void;
	}

	export interface ContentQueryParams {
		qs?: AllContentHomeQuery;
		headers?: Record<string, string>;
	}

	export interface AllContentHomeQuery {
		browsesort?: 'Alphabetical' | 'MostRecent' | 'Trend';
		browsefilter?: 'alphabetical' | 'mostrecent' | 'trend';
		appHubSubSection?: number;
		userreviewsoffset?: number;
		broadcastsoffset?: number;
		workshopitemspage?: number;
		readytouseitemspage?: number;
		mtxitemspage?: number;
		itemspage?: number;
		screenshotspage?: number;
		videospage?: number;
		artpage?: number;
		allguidepage?: number;
		webguidepage?: number;
		integratedguidepage?: number;
		discussionspage?: number;
		numperpage?: number;
		appid?: number;
		p?: number;
		l?: string;
	}

	export interface DiscoveryQueueResult {
		queue: number[];
		settings: DiscoveryQueueSettings;
		rgAppData: Record<string, DiscoveryQueueAppData>;
	}

	export interface DiscoveryQueueSettings {
		os_win: null | 0 | 1;
		os_mac: null | 0 | 1;
		os_linux: null | 0 | 1;
		full_controller_support: null | 0 | 1;
		native_steam_controller: null | 0 | 1;
		include_coming_soon: null | 0 | 1;
		excluded_tagids: number[];
		exclude_early_access: null | 0 | 1;
		exclude_videos: null | 0 | 1;
		exclude_software: null | 0 | 1;
		exclude_dlc: null | 0 | 1;
		exclude_soundtracks: null | 0 | 1;
		featured_tagids: number[];
	}

	export interface DiscoveryQueueAppData {
		name: string;
		url_name: string;
		discount_block: string;
		descids: number[];
		header: string;
		os_windows: boolean;
		has_live_broadcast: boolean;
		discount: boolean;
		localized: boolean;
	}

	export interface CommunityBadgeQuest {
		questid: number;
		completed: boolean;
	}

	export interface BadgeProgressResponse {
		response: {quests?: CommunityBadgeQuest[]};
	}

	export interface CraftedBadge {
		game: string;
		image: string;
		title: string;
		unlocked_time: number;
		xp: string;
	}

	export interface CraftedDroppedItem {
		description: string;
		economy_hover_data: string;
		image: string;
		label: string;
		title: string;
	}

	export interface CraftBadgeResponse {
		Badge: CraftedBadge;
		rgDroppedItems: CraftedDroppedItem[];
		success: number;
	}

	export interface BroadcastLink {
		url: string;
		watchId: string;
	}

	export interface BroadcastMpd {
		broadcastid: string;
		cdn_auth_url_parameters: null;
		eresult: number;
		heartbeat_interval: number;
		hls_url: string;
		is_replay: number;
		is_rtmp: number;
		is_webrtc: null;
		num_viewers: number;
		retry: number;
		success: 'ready' | string;
		title: string;
		url: string;
		viewertoken: string;
		webrtc_offer_sdp: null;
		webrtc_session_id: null;
		webrtc_turn_server: null;
	}

	export interface GuideLink {
		url: string;
		guideId: string;
	}

	export interface WorkshopLink {
		url: string;
		fileId: string;
		appId: number;
	}

	export interface ProfileBackgroundItem {
		communityitemid: string;
		image_large: string;
		name: string;
		item_title: string;
		item_description: string;
		appid: number;
		item_type: number;
		item_class: number;
		movie_webm?: string;
		movie_mp4?: string;
		movie_webm_small?: string;
		movie_mp4_small?: string;
	}

	export interface OwnedProfileItems {
		profile_backgrounds: ProfileBackgroundItem[];
		mini_profile_backgrounds: ProfileBackgroundItem[];
		avatar_frames: ProfileBackgroundItem[];
		profile_modifiers: ProfileBackgroundItem[];
	}

	export interface SharedFilesActivity {
		success: boolean;
		name: string;
		start: number;
		pagesize: string;
		total_count: number;
		upvotes: number;
		has_upvoted: number;
		comments_html: string;
		timelastpost: number;
		votetext?: string;
	}

	export interface UserNewsResponse {
		success: boolean;
		blotter_html?: string;
		next_request?: string;
		timestart?: number;
	}

	export interface ProfileVideo {
		fileId: string;
		youtubeId: string;
	}

	/** Cookies of a browser session where YouTube is linked on `https://steamcommunity.com/my/videos/link`. */
	export interface YoutubeCookies {
		/** `youtube_accesstoken`; `null` skips PostVideo. */
		accessToken: string | null;
		/** `youtube_authaccount`. */
		authAccount?: string;
		/** `youtube_refreshtoken`. */
		refreshToken?: string;
	}

	export interface WishlistResponse {
		success?: boolean;
		wishlistCount: number;
	}

	export {SteamBadgeUnlocker as default};
}

export = SteamBadgeUnlocker;
