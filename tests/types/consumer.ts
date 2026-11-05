import SteamBadgeUnlocker = require('steam-badge-unlocker');
import {createError, parseConfigString, withMissingRequiredHeaders, withRequestOptions} from 'steam-badge-unlocker/components/helpers';
import ECommunityBadgeQuests = require('steam-badge-unlocker/resources/ECommunityBadgeQuests');
import OCommunityLeaderDefault = require('steam-badge-unlocker/resources/OCommunityLeaderDefault');

declare const community: SteamBadgeUnlocker.SteamCommunityLike;

const unlocker = new SteamBadgeUnlocker(community, {apiKey: 'key'});
const defaultExport: SteamBadgeUnlocker = new SteamBadgeUnlocker.default(community);
const logged: Array<[string, unknown]> = [];
const leader = unlocker.createCommunityLeader({playSeconds: 0, log: (key, value) => logged.push([key, value])});
const defaultLeader: SteamBadgeUnlocker.CCommunityLeader = unlocker.createCommunityLeader();
const nullOptionsLeader: SteamBadgeUnlocker.CCommunityLeader = unlocker.createCommunityLeader(null);

async function runQuests(): Promise<string | null> {
	await leader.start();
	const posted: boolean = await leader.PostVideo();
	const manual: null = await leader.SetupSteamGuard();
	const finished: boolean = await leader.finish();
	const error = leader.getLastError();
	return error ? error.message : (posted && manual === null && finished ? 'OK' : null);
}

const skipCode: SteamBadgeUnlocker.ErrorCode = 'SKIP_MISSING_FRIEND';
const fileIdError = createError(SteamBadgeUnlocker.EErrorCode.MISSING_FILE_ID);
const fileIdCode: 'MISSING_FILE_ID' = fileIdError.code;
const questName: string | undefined = ECommunityBadgeQuests[101];
const joinGroupId: 101 = SteamBadgeUnlocker.ECommunityBadgeQuests.JoinGroup;
const playSeconds: number = OCommunityLeaderDefault.playSeconds;
const withHeaders: Promise<number> = withMissingRequiredHeaders(community, async () => 1);
const withOptions: Promise<string> = withRequestOptions(community, (options) => {
	options.headers = Object.assign({}, options.headers);
}, async () => 'done');
declare const screenshot: SteamBadgeUnlocker.ReadableLike;
const publicUpload: Promise<{success: true, id: string}> = unlocker.uploadScreenshot(767, 'title', '', screenshot, SteamBadgeUnlocker.EPublishedFileVisibility.Public);
// @ts-expect-error a number that is not an EPublishedFileVisibility value
const idUpload = unlocker.uploadScreenshot(767, 'title', '', screenshot, 5);
const privateId: SteamBadgeUnlocker.EPublishedFileVisibility = SteamBadgeUnlocker.EPublishedFileVisibility.Private;
const accountParams: number[] = parseConfigString('user;password1;').map(account => account.params.length);
// @ts-expect-error a code that is not in EErrorCode
const unknownCode: SteamBadgeUnlocker.ErrorCode = 'UNKNOWN_CODE';

interface FullCommunity extends SteamBadgeUnlocker.SteamCommunityLike {
	acceptConfirmationForObject(identitySecret: string, objectId: string, callback: (error: Error | null) => void): void;
}
declare const fullCommunity: FullCommunity;
const typedUnlocker = new SteamBadgeUnlocker(fullCommunity);
typedUnlocker.getCommunity().acceptConfirmationForObject('secret', '1', () => undefined);
const explicitUnlocker: SteamBadgeUnlocker<FullCommunity> = typedUnlocker;
const plainUnlocker: SteamBadgeUnlocker = typedUnlocker;
const pageMatched: Promise<boolean> = unlocker.get({url: 'https://steamcommunity.com/'}).then(body => body.match(/guide/) !== null);
const postSucceeded: Promise<boolean> = unlocker.post({url: 'https://steamcommunity.com/', json: true}).then(body => body.success === 1);

function callEveryMember(member: SteamBadgeUnlocker): void {
	const language: string = member.getLanguage();
	const steamId: string = member.getSteamId();
	const profileUrl: string = member.getProfileUrl();
	const customUrl: string = member.setCustomProfileUrl('custom');
	const sessionId: string = member.getSessionId();
	const apiKey: Promise<string> = member.getWebApiKey();
	const webApiToken: Promise<string> = member.getWebApiToken();
	// @ts-expect-error the custom URL is a string
	member.setCustomProfileUrl(1);

	const cleared: Promise<string> = member.clearDiscoveryQueueAppId(730, 1);
	const queue: Promise<SteamBadgeUnlocker.DiscoveryQueueResult> = member.generateNewDiscoveryQueue(0);
	const finished: Promise<Array<{status: 'fulfilled', value: string} | {status: 'rejected', reason: unknown}> | string[]> = member.finishDiscoveryQueue();
	const contentHome: Promise<string> = member.getAllContentHome('screenshots', {});
	// @ts-expect-error the app id is a number
	member.clearDiscoveryQueueAppId('730');

	const progress: Promise<SteamBadgeUnlocker.BadgeProgressResponse> = member.getCommunityBadgeProgress('key', 2);
	const favorite: Promise<boolean> = member.setFavoriteBadge(2, false);
	const crafted: Promise<SteamBadgeUnlocker.CraftBadgeResponse> = member.craftBadge(730, 0, 1);
	const readyToCraft: Promise<number[]> = member.getAppIdsReadyForCrafting(1);
	const profileProgress: Promise<SteamBadgeUnlocker.BadgeProgressResponse> = member.getCommunityBadgeProgressFromProfile(2);
	// @ts-expect-error the border color is 0 or 1
	member.craftBadge(730, 2);

	const manifest: Promise<SteamBadgeUnlocker.BroadcastMpd> = member.getBroadcastManifest('76561197960287930');
	const broadcasts: Promise<SteamBadgeUnlocker.BroadcastLink[]> = member.getBroadcastTrendLinks({});
	// @ts-expect-error the Steam ID is a string
	member.getBroadcastManifest(76561197960287930);

	const discussions: Promise<string> = member.discussionsSearch('badge');
	// @ts-expect-error the query is a string
	member.discussionsSearch(1);

	const guides: Promise<SteamBadgeUnlocker.GuideLink[]> = member.getGuidesTrendLinks({});
	// @ts-expect-error the params are an object
	member.getGuidesTrendLinks('guides');

	const realName: Promise<true> = member.setRealName('John');
	const avatar: Promise<true> = member.selectAvatar(730, 0);
	const background: Promise<{response: object}> = member.setProfileBackground('1');
	const ownedItems: Promise<{response: SteamBadgeUnlocker.OwnedProfileItems}> = member.getOwnedProfileItems();
	const upvoteLogged: Promise<'null'> = member.logFriendActivityUpvote();
	const news: Promise<SteamBadgeUnlocker.UserNewsResponse> = member.getUserNews(null);
	const friendPosts: Promise<SteamBadgeUnlocker.CommentActionParams[]> = member.getLastFriendPosts(1);
	const voted: Promise<SteamBadgeUnlocker.SharedFilesActivity> = member.voteContent({type: 'UserStatusPublished', owner: '1', feature: '2', action: 'upvote'});
	const recommended: Promise<{success: boolean, strError?: string}> = member.addGameRecommendation(730, 'comment', true);
	const recommendationDeleted: Promise<string | object> = member.deleteGameRecommendation(730);
	// @ts-expect-error the real name is a string
	member.setRealName(1);

	const subscribed: Promise<true> = member.subscribeToSharedFile('1', 730);
	const unsubscribed: Promise<true> = member.unsubscribeFromSharedFile('1', '730');
	const fileDetails: Promise<string> = member.getSharedFileDetails(1, {qs: {appid: 730}});
	const fileVoted: Promise<true> = member.voteSharedFile('1', true);
	const fileDeleted: Promise<true> = member.deleteSharedFile('1', 730, 'screenshots');
	const commentPosted: Promise<string> = member.postSharedFileComment('76561197960287930', '1', 'comment', 1);
	const commentDeleted: Promise<true> = member.deleteSharedFileComment('76561197960287930', '1', '2', 1);
	// @ts-expect-error the file id is a string
	member.voteSharedFile(1);

	const videos: Promise<SteamBadgeUnlocker.ProfileVideo[]> = member.getProfileVideos({qs: {}});
	const youtubeVideos: Promise<Array<{youtubeId: string}>> = member.fetchYoutubeVideos();
	const postedVideos: Promise<number> = member.postYoutubeVideo(['id'], 730, '');
	member.setYoutubeCookies({accessToken: 'token'});
	// @ts-expect-error the YouTube ids are strings
	member.postYoutubeVideo(1);

	member.makeNavCookie('1_4_4_', 'https://store.steampowered.com/');
	const modified: Promise<SteamBadgeUnlocker.WishlistResponse> = member.modifyWishlist('1_4_4_', 730, false);
	const added: Promise<SteamBadgeUnlocker.WishlistResponse> = member.addToWishlist(730);
	const removed: Promise<SteamBadgeUnlocker.WishlistResponse> = member.removeFromWishlist(730, '1_4_4_');
	// @ts-expect-error remove is a boolean
	member.modifyWishlist('1_4_4_', 730, 1);

	const workshopLinks: Promise<SteamBadgeUnlocker.WorkshopLink[]> = member.getWorkshopTrendLinks({});
	// @ts-expect-error the params are an object
	member.getWorkshopTrendLinks(1);

	const workshopType: 2 = SteamBadgeUnlocker.EFileType.workshop;
	const newsSection: 5 = SteamBadgeUnlocker.ESubSection.news;
}

export {runQuests, defaultExport, defaultLeader, nullOptionsLeader, skipCode, fileIdCode, questName, joinGroupId, playSeconds, withHeaders, withOptions, publicUpload, idUpload, privateId, accountParams, unknownCode, explicitUnlocker, plainUnlocker, pageMatched, postSucceeded, callEveryMember};
