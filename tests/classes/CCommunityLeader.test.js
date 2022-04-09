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

