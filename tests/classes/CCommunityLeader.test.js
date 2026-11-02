const SteamBadgeUnlocker = require('../../index');
const SteamCommunityMock = require('../mocks/SteamCommunityMock');
const SteamUserMock = require('../mocks/SteamUserMock');
const assert = require('assert');

const _badgeUnlocker = new SteamBadgeUnlocker(new SteamCommunityMock());

const leader = _badgeUnlocker.createCommunityLeader({
	friendSteamId: '76000000000000001',
	friendsScreenshotFileId: '1000',

	friendsPageComment: '1000',
	statusText: '1000',

	joinGroupId: '1000',
	masterInstance: null,
	playSeconds: 0.001,
	steamUser: new SteamUserMock(),
	youtubeCookies: {
		accessToken: '%7B%22access_token%22%3A%22ya29.test-EURtest_test-test%22%2C%22expires_in%22%3A3599%2C%22scope%22%3A%22https%3A%5C%2F%5C%2Fwww.googleapis.com%5C%2Fauth%5C%2Fyoutube.readonly%22%2C%22token_type%22%3A%22Bearer%22%2C%22created%22%3A1645751827%7D',
		authAccount: 'test',
		refreshToken: 'null',
	}
});

it('init()', async () => {
	assert.strictEqual(typeof leader.init, 'function');
});

const taskNames = [
	'AddFriendToFriendsList',
	'AddItemToWishlist',
	// 'AddPhoneToAccount',
	// 'AddTwoFactorToAccount',
	// 'BuyOrSellOnMarket',
	'CraftGameBadge',
	'FeatureBadgeOnProfile',
	'JoinGroup',
	'PlayGame',
	'PostCommentOnFriendsPage',
	'PostCommentOnFriendsScreenshot',
	'PostScreenshot',
	'PostStatusToFriends',
	'PostVideo',
	'RateUpContentInActivityFeed',
	'RateWorkshopItem',
	'RecommendGame',
	'SearchInDiscussions',
	'SetProfileBackground',
	'SetupCommunityAvatar',
	'SetupCommunityRealName',
	// 'SetupSteamGuard',
	'SubscribeToWorkshopItem',
	// 'Trade',
	'UseDiscoveryQueue',
	'UseEmoticonInChat',
	'ViewBroadcast',
	'ViewGuideInOverlay',
];
taskNames.forEach(task => {

	it(`${task}()`, async () => {
		assert.strictEqual(typeof leader[task], 'function');
		assert.ok(await leader[task]());
	});

});


it('SetProfileBackground() - without crafting', async () => {
	leader._rgDroppedItems = [];
	leader._badgeUnlocker.setProfileBackground = id => new Promise((resolve) => resolve(id === '7000000000' ? {response: {}} : null));
	assert.ok(await leader.SetProfileBackground());
});


/**
 * @param {Promise} promise
 * @param {number} ms
 * @returns {Promise<*>}
 */
function settleOrTimeout(promise, ms = 500) {
	return Promise.race([promise, new Promise(resolve => setTimeout(() => resolve('timeout'), ms))]);
}

it('PostVideo() - disabled with accessToken null', async () => {
	const videoLeader = new SteamBadgeUnlocker(new SteamCommunityMock()).createCommunityLeader({
		youtubeCookies: {accessToken: null},
	});
	assert.strictEqual(await settleOrTimeout(videoLeader.PostVideo()), false);
});

it('PostScreenshot() - cleanup failure does not hang', async () => {
	const screenshotUnlocker = new SteamBadgeUnlocker(new SteamCommunityMock());
	screenshotUnlocker.deleteSharedFile = () => Promise.reject(new Error('profile_fatalerror_message'));
	const screenshotLeader = screenshotUnlocker.createCommunityLeader({});
	assert.strictEqual(await settleOrTimeout(screenshotLeader.PostScreenshot()), true);
});

it('start() - forceAddFriend runs each friend quest once', async () => {
	const runUnlocker = new SteamBadgeUnlocker(new SteamCommunityMock());
	runUnlocker.getCommunityBadgeProgress = async () => ({
		response: {
			quests: [108, 125, 113].map(questid => ({questid, completed: false})),
		},
	});
	const runLeader = runUnlocker.createCommunityLeader({forceAddFriend: true, log: () => null});
	const calls = [];
	['AddItemToWishlist', 'UseEmoticonInChat', 'AddFriendToFriendsList'].forEach(name => {
		runLeader[name] = async () => {
			calls.push(name);
			return true;
		};
	});
	await runLeader.start();
	assert.deepStrictEqual(calls.sort(), ['AddFriendToFriendsList', 'AddItemToWishlist', 'UseEmoticonInChat']);
});

it('start() - waits before the final progress read when quests were solved', async () => {
	const runUnlocker = new SteamBadgeUnlocker(new SteamCommunityMock());
	runUnlocker.getCommunityBadgeProgress = async () => ({response: {quests: [{questid: 108, completed: false}]}});
	const runLeader = runUnlocker.createCommunityLeader({log: () => null});
	runLeader.AddItemToWishlist = async () => true;
	const startedAt = Date.now();
	await runLeader.start();
	assert.ok(Date.now() - startedAt >= 1900, 'expected the 2 s pause');
});

it('PlayGame() - steam-user license request failure does not hang', async () => {
	const steamUser = new SteamUserMock();
	steamUser.requestFreeLicense = () => Promise.reject(new Error('RateLimitExceeded'));
	const playLeader = new SteamBadgeUnlocker(new SteamCommunityMock()).createCommunityLeader({steamUser, playSeconds: 0.001});
	assert.strictEqual(await settleOrTimeout(playLeader.PlayGame()), true);
});

it('UseEmoticonInChat() - steam-user send failure does not hang', async () => {
	const steamUser = new SteamUserMock();
	steamUser.chat.sendFriendMessage = () => Promise.reject(new Error('NotFriends'));
	const chatLeader = new SteamBadgeUnlocker(new SteamCommunityMock()).createCommunityLeader({steamUser, friendSteamId: '76000000000000001'});
	assert.strictEqual(await settleOrTimeout(chatLeader.UseEmoticonInChat()), false);
	assert.strictEqual(chatLeader.getLastError().message, 'NotFriends');
});

it('friend quests - resolve without a friend', async () => {
	const community = new SteamCommunityMock();
	const throwOnMissingFriend = (steamId) => {
		if (!steamId) {
			throw new TypeError('Cannot read properties of null');
		}
	};
	['addFriend', 'removeFriend', 'postUserComment'].forEach(name => community[name] = throwOnMissingFriend);
	const steamUser = new SteamUserMock();
	steamUser.chat.sendFriendMessage = throwOnMissingFriend;
	const lonelyLeader = new SteamBadgeUnlocker(community).createCommunityLeader({steamUser, forceRemoveFriend: true});
	assert.strictEqual(await settleOrTimeout(lonelyLeader.AddFriendToFriendsList().catch(e => e.message)), false);
	assert.strictEqual(await settleOrTimeout(lonelyLeader.PostCommentOnFriendsPage().catch(e => e.message)), false);
	assert.strictEqual(await settleOrTimeout(lonelyLeader.UseEmoticonInChat().catch(e => e.message)), false);
	assert.strictEqual(await settleOrTimeout(lonelyLeader.finish().catch(e => e.message)), true);
});

it('steam-user methods - non-promise return values do not hang', async () => {
	const steamUser = new SteamUserMock();
	steamUser.requestFreeLicense = () => undefined;
	steamUser.chat.sendFriendMessage = () => undefined;
	const syncLeader = new SteamBadgeUnlocker(new SteamCommunityMock()).createCommunityLeader({steamUser, playSeconds: 0.001, friendSteamId: '76000000000000001'});
	assert.strictEqual(await settleOrTimeout(syncLeader.PlayGame()), true);
	assert.strictEqual(await settleOrTimeout(syncLeader.UseEmoticonInChat()), false);
});

it('start() - a throwing quest is logged and the run continues', async () => {
	const community = new SteamCommunityMock();
	community.joinGroup = () => {
		throw new Error('boom');
	};
	const runUnlocker = new SteamBadgeUnlocker(community);
	runUnlocker.getCommunityBadgeProgress = async () => ({
		response: {quests: [101, 108].map(questid => ({questid, completed: false}))},
	});
	const logs = [];
	await runUnlocker.createCommunityLeader({log: (key, value) => logs.push([key, value])}).start();
	assert.deepStrictEqual(logs.filter(([key]) => key !== '-'), [['JoinGroup', 'boom'], ['AddItemToWishlist', 'OK']]);
});

it('start() - logs the code of a failed quest instead of its message', async () => {
	const community = new SteamCommunityMock();
	community.joinGroup = (groupId, callback) => callback(Object.assign(new Error('HTTP error 429'), {code: 429}));
	const runUnlocker = new SteamBadgeUnlocker(community);
	runUnlocker.getCommunityBadgeProgress = async () => ({response: {quests: [{questid: 101, completed: false}]}});
	const logs = [];
	await runUnlocker.createCommunityLeader({log: (key, value) => logs.push([key, value])}).start();
	assert.deepStrictEqual(logs.filter(([key]) => key !== '-'), [['JoinGroup', 429]]);
});

it('UseEmoticonInChat() - without steamUser, the webchat logon is not started', async () => {
	const community = new SteamCommunityMock();
	let chatLogons = 0;
	community.chatLogon = () => chatLogons++;
	const chatLeader = new SteamBadgeUnlocker(community).createCommunityLeader({friendSteamId: '76000000000000001', steamUser: null});
	assert.strictEqual(await settleOrTimeout(chatLeader.UseEmoticonInChat()), false);
	assert.strictEqual(chatLogons, 0);
});

it('PostVideo() - keeps a video that was on the profile before', async () => {
	const videoUnlocker = new SteamBadgeUnlocker(new SteamCommunityMock());
	const deleted = [];
	videoUnlocker.deleteSharedFile = async (fileId) => deleted.push(fileId);
	const videoLeader = videoUnlocker.createCommunityLeader({youtubeCookies: leader.options.youtubeCookies, youtubeId: 'test'});
	await settleOrTimeout(videoLeader.PostVideo());
	assert.deepStrictEqual(deleted, []);
});

it('PostVideo() - deletes only the video it added', async () => {
	const videoUnlocker = new SteamBadgeUnlocker(new SteamCommunityMock());
	const pages = [[{youtubeId: 'test', fileId: '1'}], [{youtubeId: 'test', fileId: '1'}, {youtubeId: 'test', fileId: '2'}]];
	videoUnlocker.getProfileVideos = async () => pages.shift();
	const deleted = [];
	videoUnlocker.deleteSharedFile = async (fileId) => deleted.push(fileId);
	const videoLeader = videoUnlocker.createCommunityLeader({youtubeCookies: leader.options.youtubeCookies, youtubeId: 'test'});
	assert.strictEqual(await settleOrTimeout(videoLeader.PostVideo()), true);
	assert.deepStrictEqual(deleted, ['2']);
});


it('quests - synchronous errors settle instead of hanging', async () => {
	const community = new SteamCommunityMock();
	community.addFriend = () => {
		throw new Error('Unknown SteamID input format');
	};
	const steamUser = new SteamUserMock();
	steamUser.chat.sendFriendMessage = () => {
		throw new TypeError('message.replace is not a function');
	};
	const brokenUnlocker = new SteamBadgeUnlocker(community);
	brokenUnlocker.setYoutubeCookies = () => {
		throw new URIError('URI malformed');
	};
	brokenUnlocker.getOwnedProfileItems = async () => ({});
	const brokenLeader = brokenUnlocker.createCommunityLeader({
		friendSteamId: 'vanity',
		steamUser,
		screenshotPath: null,
		youtubeCookies: {accessToken: 'token'},
	});
	for (const quest of ['AddFriendToFriendsList', 'PostScreenshot', 'PostVideo', 'UseEmoticonInChat', 'SetProfileBackground']) {
		assert.notStrictEqual(await settleOrTimeout(brokenLeader[quest]().catch(() => 'rejected')), 'timeout', quest);
	}
});

it('start() - logs the HTTP status of a failed quest request', async () => {
	const community = new SteamCommunityMock();
	const runUnlocker = new SteamBadgeUnlocker(community);
	runUnlocker.getCommunityBadgeProgress = async () => ({response: {quests: [{questid: 108, completed: false}]}});
	community.setResultStack([[Object.assign(new Error('HTTP error 429'), {code: 429}), {statusCode: 429}, null]]);
	const logs = [];
	await runUnlocker.createCommunityLeader({log: (key, value) => logs.push([key, value])}).start();
	assert.deepStrictEqual(logs.filter(([key]) => key !== '-'), [['AddItemToWishlist', 429]]);
});

it('start() - a quest rejecting without an Error still lets the run continue', async () => {
	const runUnlocker = new SteamBadgeUnlocker(new SteamCommunityMock());
	runUnlocker.getCommunityBadgeProgress = async () => ({response: {quests: [125, 108].map(questid => ({questid, completed: false}))}});
	const steamUser = new SteamUserMock();
	steamUser.chat.sendFriendMessage = () => Promise.reject(undefined);
	const logs = [];
	const runLeader = runUnlocker.createCommunityLeader({friendSteamId: '76000000000000001', steamUser, log: (key, value) => logs.push([key, value])});
	await settleOrTimeout(runLeader.start(), 2000);
	assert.deepStrictEqual(logs.filter(([key]) => key !== '-'), [['AddItemToWishlist', 'OK'], ['UseEmoticonInChat', false]]);
});

it('quests - resolve false and keep the request error for getLastError()', async () => {
	const community = new SteamCommunityMock();
	const questLeader = new SteamBadgeUnlocker(community).createCommunityLeader({});
	community.setResultStack([[Object.assign(new Error('HTTP error 429'), {code: 429}), {statusCode: 429}, null]]);
	assert.strictEqual(await questLeader.AddItemToWishlist(), false);
	assert.strictEqual(questLeader.getLastError().code, 429);
	assert.strictEqual(await questLeader.SearchInDiscussions(), true);
	assert.strictEqual(questLeader.getLastError(), null);
});

it('PostVideo() - does not post without the list of videos shared before', async () => {
	const videoUnlocker = new SteamBadgeUnlocker(new SteamCommunityMock());
	videoUnlocker.getProfileVideos = () => Promise.reject(Object.assign(new Error('HTTP error 429'), {code: 429}));
	let posted = false;
	videoUnlocker.postYoutubeVideo = async () => {
		posted = true;
		return 1;
	};
	const videoLeader = videoUnlocker.createCommunityLeader({youtubeCookies: leader.options.youtubeCookies, youtubeId: 'test'});
	assert.strictEqual(await settleOrTimeout(videoLeader.PostVideo()), false);
	assert.strictEqual(posted, false);
});

it('init() - a failed master screenshot request is not cached', async () => {
	let requests = 0;
	const master = {
		steamID: '76000000000000009',
		httpRequestGet: (params, callback) => ++requests === 1
			? callback(Object.assign(new Error('HTTP error 429'), {code: 429}))
			: callback(null, {statusCode: 200}, '<div data-publishedfileid="4200"></div>'),
	};
	const first = new SteamBadgeUnlocker(new SteamCommunityMock()).createCommunityLeader({masterInstance: master, log: () => null});
	await first.init();
	const second = new SteamBadgeUnlocker(new SteamCommunityMock()).createCommunityLeader({masterInstance: master, log: () => null});
	await second.init();
	assert.strictEqual(first.options.friendsScreenshotFileId, null);
	assert.strictEqual(second.options.friendsScreenshotFileId, '4200');
});

it('start() - a community without getSteamUser still runs the quests', async () => {
	const community = new SteamCommunityMock();
	delete community.getSteamUser;
	const runUnlocker = new SteamBadgeUnlocker(community);
	runUnlocker.getCommunityBadgeProgress = async () => ({response: {quests: [{questid: 108, completed: false}]}});
	const logs = [];
	await settleOrTimeout(runUnlocker.createCommunityLeader({log: (key, value) => logs.push([key, value])}).start(), 2000);
	assert.deepStrictEqual(logs.filter(([key]) => key !== '-'), [['AddItemToWishlist', 'OK']]);
});

it('start() - a quest replaced on the instance is guarded like the prototype quests', async () => {
	const runUnlocker = new SteamBadgeUnlocker(new SteamCommunityMock());
	runUnlocker.getCommunityBadgeProgress = async () => ({response: {quests: [101, 108].map(questid => ({questid, completed: false}))}});
	const logs = [];
	const runLeader = runUnlocker.createCommunityLeader({log: (key, value) => logs.push([key, value])});
	runLeader.JoinGroup = async () => {
		throw new Error('custom join failed');
	};
	await settleOrTimeout(runLeader.start(), 2000);
	assert.deepStrictEqual(logs.filter(([key]) => key !== '-'), [['JoinGroup', 'custom join failed'], ['AddItemToWishlist', 'OK']]);
});

it('start() - a quest replaced on the instance does not report the error of the quest before', async () => {
	const community = new SteamCommunityMock();
	const runUnlocker = new SteamBadgeUnlocker(community);
	runUnlocker.getCommunityBadgeProgress = async () => ({response: {quests: [108, 123].map(questid => ({questid, completed: false}))}});
	community.setResultStack([[Object.assign(new Error('HTTP error 429'), {code: 429}), {statusCode: 429}, null]]);
	const logs = [];
	const runLeader = runUnlocker.createCommunityLeader({log: (key, value) => logs.push([key, value])});
	runLeader.SearchInDiscussions = async () => false;
	await runLeader.start();
	assert.deepStrictEqual(logs.filter(([key]) => key !== '-'), [['AddItemToWishlist', 429], ['SearchInDiscussions', false]]);
});

it('quests - a missing friend, steamUser or YouTube token is a skip with its code', async () => {
	const skipLeader = new SteamBadgeUnlocker(new SteamCommunityMock()).createCommunityLeader({youtubeCookies: {accessToken: null}});
	const skips = [];
	for (const quest of ['AddFriendToFriendsList', 'PostCommentOnFriendsPage', 'PostCommentOnFriendsScreenshot', 'UseEmoticonInChat', 'PlayGame', 'PostVideo']) {
		skips.push([quest, await skipLeader[quest](), skipLeader.getLastError().code]);
	}
	assert.deepStrictEqual(skips, [
		['AddFriendToFriendsList', false, 'SKIP_MISSING_FRIEND'],
		['PostCommentOnFriendsPage', false, 'SKIP_MISSING_FRIEND'],
		['PostCommentOnFriendsScreenshot', false, 'SKIP_MISSING_FRIEND'],
		['UseEmoticonInChat', false, 'SKIP_MISSING_FRIEND'],
		['PlayGame', false, 'SKIP_MISSING_STEAM_USER'],
		['PostVideo', false, 'SKIP_MISSING_YOUTUBE_ACCESS_TOKEN'],
	]);
	const chatLeader = new SteamBadgeUnlocker(new SteamCommunityMock()).createCommunityLeader({friendSteamId: '76000000000000001'});
	assert.strictEqual(await chatLeader.UseEmoticonInChat(), false);
	assert.strictEqual(chatLeader.getLastError().code, 'SKIP_MISSING_STEAM_USER');
});

it('getLastError() - a rejection without an Error leaves null', async () => {
	const steamUser = new SteamUserMock();
	steamUser.chat.sendFriendMessage = () => Promise.reject(undefined);
	const chatLeader = new SteamBadgeUnlocker(new SteamCommunityMock()).createCommunityLeader({friendSteamId: '76000000000000001', steamUser});
	assert.strictEqual(await chatLeader.UseEmoticonInChat(), false);
	assert.strictEqual(chatLeader.getLastError(), null);
});
