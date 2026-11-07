const SteamBadgeUnlocker = require('../../index');
const fs = require('fs');
const EventEmitter = require('events');
const SteamCommunityMock = require('../mocks/SteamCommunityMock');
const SteamUserMock = require('../mocks/SteamUserMock');
const assert = require('assert');

const realSetTimeout = setTimeout;
const shortenedPauses = [];

beforeEach(() => {
	shortenedPauses.length = 0;
	global.setTimeout = (callback, ms, ...args) => {
		if (ms >= 1000) {
			shortenedPauses.push(ms);
			return realSetTimeout(callback, 0, ...args);
		}
		return realSetTimeout(callback, ms, ...args);
	};
});

afterEach(() => {
	global.setTimeout = realSetTimeout;
});

const _badgeUnlocker = new SteamBadgeUnlocker(new SteamCommunityMock());

const leader = _badgeUnlocker.createCommunityLeader({
	friendSteamId: '76000000000000001',
	friendsScreenshotFileId: '1000',

	friendsPageComment: '1000',
	statusText: '1000',

	joinGroupId: '1000',
	masterInstance: null,
	playSeconds: 0.001,
	resetRealNameAfterSeconds: 0.001,
	steamUser: new SteamUserMock(),
	youtubeCookies: {
		accessToken: '%7B%22access_token%22%3A%22ya29.test-EURtest_test-test%22%2C%22expires_in%22%3A3599%2C%22scope%22%3A%22https%3A%5C%2F%5C%2Fwww.googleapis.com%5C%2Fauth%5C%2Fyoutube.readonly%22%2C%22token_type%22%3A%22Bearer%22%2C%22created%22%3A1645751827%7D',
		authAccount: 'test',
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
	return Promise.race([promise, new Promise(resolve => realSetTimeout(() => resolve('timeout'), ms))]);
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
	await runLeader.start();
	assert.deepStrictEqual(shortenedPauses, [2000], 'expected the 2 s pause');
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

it('start() - stops at the first request Akamai denies and rejects with ACCESS_DENIED', async () => {
	const community = new SteamCommunityMock();
	const emitter = new EventEmitter();
	community.on = emitter.on.bind(emitter);
	community.removeListener = emitter.removeListener.bind(emitter);
	const page = fs.readFileSync(__dirname + '/../fixtures/pages/akamai-access-denied.html', 'utf8');
	community.joinGroup = (groupId, callback) => {
		const httpError = Object.assign(new Error('HTTP error 403'), {code: 403});
		callback(httpError);
		emitter.emit('postHttpRequest', 1, 'steamcommunity', {uri: 'https://steamcommunity.com/groups/test/?l=english', method: 'POST'}, httpError, {statusCode: 403, headers: {server: 'AkamaiGHost'}}, page);
	};
	const runUnlocker = new SteamBadgeUnlocker(community);
	runUnlocker.getCommunityBadgeProgress = async () => ({
		response: {quests: [101, 108].map(questid => ({questid, completed: false}))},
	});
	const logs = [];
	const runLeader = runUnlocker.createCommunityLeader({log: (key, value) => logs.push([key, value])});
	const error = await runLeader.start().then(() => null, rejection => rejection);
	assert.deepStrictEqual(
		{code: error.code, quest: error.quest, reference: error.reference, url: error.url, method: error.method},
		{code: 'ACCESS_DENIED', quest: 'JoinGroup', reference: '18.202c1102.1793901546.74e95e7', url: 'https://steamcommunity.com/groups/test/', method: 'POST'},
	);
	assert.deepStrictEqual(logs.filter(([key]) => key !== '-'), [['JoinGroup', 'ACCESS_DENIED']]);
	assert.strictEqual(runLeader.getLastError(), error);
	assert.strictEqual(emitter.listenerCount('postHttpRequest'), 0);
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

it('SetupCommunityRealName() - editProfile requests send the Accept-Language header', async () => {
	const community = new SteamCommunityMock();
	const acceptLanguages = [];
	community.editProfile = (settings, callback) => {
		const options = {};
		community.onPreHttpRequest(1, 'steamcommunity', options, () => null);
		acceptLanguages.push(options.headers['Accept-Language']);
		callback(null);
	};
	const realNameLeader = new SteamBadgeUnlocker(community).createCommunityLeader({resetRealNameAfterSeconds: 0.001});
	assert.strictEqual(await realNameLeader.SetupCommunityRealName(), true);
	assert.deepStrictEqual(acceptLanguages, ['en-US,en;q=0.9', 'en-US,en;q=0.9']);
	assert.ok(!('onPreHttpRequest' in community));
});

it('SetupCommunityRealName() - waits resetRealNameAfterSeconds before clearing the name', async () => {
	const nameUnlocker = new SteamBadgeUnlocker(new SteamCommunityMock());
	const edits = [];
	nameUnlocker.setRealName = async (realName) => {
		edits.push([realName, Date.now()]);
		return true;
	};
	const nameLeader = nameUnlocker.createCommunityLeader({resetRealNameAfterSeconds: 0.2});
	assert.strictEqual(await nameLeader.SetupCommunityRealName(), true);
	assert.deepStrictEqual(edits.map(([name]) => name), ['John', '']);
	assert.ok(edits[1][1] - edits[0][1] >= 190, 'reset waits ' + (edits[1][1] - edits[0][1]) + ' ms');
});

it('SubscribeToWorkshopItem() - unsubscribes from the item it subscribed to', async () => {
	const workshopUnlocker = new SteamBadgeUnlocker(new SteamCommunityMock());
	const calls = [];
	workshopUnlocker.subscribeToSharedFile = async (fileId, appId) => {
		calls.push(['subscribe', fileId, appId]);
		return true;
	};
	workshopUnlocker.unsubscribeFromSharedFile = async (fileId, appId) => {
		calls.push(['unsubscribe', fileId, appId]);
		return true;
	};
	const result = await workshopUnlocker.createCommunityLeader({workshopFileId: '1000', workshopAppId: 730}).SubscribeToWorkshopItem();
	assert.deepStrictEqual([result, calls], [true, [['subscribe', '1000', 730], ['unsubscribe', '1000', 730]]]);
});

it('SubscribeToWorkshopItem() - a failed unsubscribe keeps the result of the subscription', async () => {
	const workshopUnlocker = new SteamBadgeUnlocker(new SteamCommunityMock());
	workshopUnlocker.subscribeToSharedFile = async () => true;
	workshopUnlocker.unsubscribeFromSharedFile = () => Promise.reject(new Error('Too Many Requests'));
	assert.strictEqual(await workshopUnlocker.createCommunityLeader({}).SubscribeToWorkshopItem(), true);
});
