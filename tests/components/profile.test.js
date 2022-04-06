const SteamBadgeUnlocker = require('../../index');
const SteamCommunityMock = require('../lib/SteamCommunityMock');
const assert = require('assert');

const _badgeUnlocker = new SteamBadgeUnlocker(new SteamCommunityMock());
it('selectAvatar()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.selectAvatar, 'function');
	const result = await _badgeUnlocker.selectAvatar(1000);
	assert.strictEqual(typeof result, 'boolean');
	assert.ok(result);
});

it('setProfileBackground()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.setProfileBackground, 'function');
	const result = await _badgeUnlocker.setProfileBackground('1000');
	assert.strictEqual(typeof result, 'object');
	assert.strictEqual(typeof result.response, 'object');
});
it('getOwnedProfileItems()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.getOwnedProfileItems, 'function');
	const result = await _badgeUnlocker.getOwnedProfileItems();
	assert.strictEqual(typeof result, 'object');
	assert.strictEqual(typeof result.response, 'object');
	assert.strictEqual(typeof result.response.profile_backgrounds, 'object');
	assert.strictEqual(typeof result.response.profile_backgrounds[0], 'object');
	assert.strictEqual(result.response.profile_backgrounds[0].appid, 1000);
});
it('logFriendActivityUpvote()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.logFriendActivityUpvote, 'function');
	const result = await _badgeUnlocker.logFriendActivityUpvote();
	assert.strictEqual(result, 'null');
});

it('getUserNews()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.getUserNews, 'function');
	const result = await _badgeUnlocker.getUserNews();
	assert.strictEqual(typeof result, 'object');
	assert.ok(result.success);
	assert.ok(/id="commentthread_[\d\w_]+_area"/.test(result.blotter_html));
});

const lastPost = {
	type: 'UserStatusPublished',
	owner: '76000000000000001',
	feature: '1000000000',
};

it('getLastFriendPosts()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.getLastFriendPosts, 'function');
	const result = await _badgeUnlocker.getLastFriendPosts();
	assert.strictEqual(typeof result, 'object');
	assert.strictEqual(result[0].owner, lastPost.owner);
	assert.strictEqual(result[0].type, lastPost.type);
	assert.strictEqual(result[0].feature, lastPost.feature);
});
it('voteContent()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.voteContent, 'function');
	const result = await _badgeUnlocker.voteContent({
		...lastPost,
		action: 'upvote',
	});
	assert.strictEqual(typeof result, 'object');
	assert.ok(result.success);
	assert.ok(result.upvotes > 0);
});
it('addGameRecommendation()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.addGameRecommendation, 'function');
	const result = await _badgeUnlocker.addGameRecommendation(1000, 'test');
	assert.strictEqual(typeof result, 'object');
	assert.ok(result.success);
});
it('deleteGameRecommendation()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.deleteGameRecommendation, 'function');
	const result = await _badgeUnlocker.deleteGameRecommendation(1000);
	assert.strictEqual(typeof result, 'string');
});


