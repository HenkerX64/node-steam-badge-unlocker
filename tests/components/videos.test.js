const SteamBadgeUnlocker = require('../../index');
const SteamCommunityMock = require('../mocks/SteamCommunityMock');
const assert = require('assert');

const _badgeUnlocker = new SteamBadgeUnlocker(new SteamCommunityMock());
const youtubeCookies = {
	// {"access_token":"ya29.test-EURtest_test-test","expires_in":3599,"scope":"https:\\/\\/www.googleapis.com\\/auth\\/youtube.readonly","token_type":"Bearer","created":1645751827}
	accessToken: '%7B%22access_token%22%3A%22ya29.test-EURtest_test-test%22%2C%22expires_in%22%3A3599%2C%22scope%22%3A%22https%3A%5C%2F%5C%2Fwww.googleapis.com%5C%2Fauth%5C%2Fyoutube.readonly%22%2C%22token_type%22%3A%22Bearer%22%2C%22created%22%3A1645751827%7D',
	authAccount: 'test',
	refreshToken: 'null',
};

it('setYoutubeCookies()', () => {
	assert.strictEqual(typeof _badgeUnlocker.setYoutubeCookies, 'function');
	_badgeUnlocker.setYoutubeCookies(youtubeCookies);
	const _communityMock = _badgeUnlocker.getCommunity();
	assert.strictEqual(_communityMock._cookies.length, 3);
	assert.strictEqual(_communityMock._cookies.filter(cookie => cookie.match(/youtube_accesstoken=.*access_token/)).length, 1);
	assert.strictEqual(_communityMock._cookies.filter(cookie => cookie.match(/youtube_authaccount=test/)).length, 1);
	assert.strictEqual(_communityMock._cookies.filter(cookie => cookie.match(/youtube_refreshtoken=null/)).length, 1);
	// cleanup
	_communityMock.setCookies([]);
});
it('postYoutubeVideo() - no cookies', async () => {
	assert.strictEqual(typeof _badgeUnlocker.postYoutubeVideo, 'function');
	const result = await _badgeUnlocker.postYoutubeVideo('test').catch(() => null);
	assert.strictEqual(result, null);
});
it('getProfileVideos()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.getProfileVideos, 'function');
	const result = await _badgeUnlocker.getProfileVideos();
	assert.strictEqual(typeof result, 'object');
	assert.strictEqual(result.length, 1);
	assert.strictEqual(result[0].fileId, '1600000000');
	assert.strictEqual(result[0].youtubeId, 'test');
});
it('postYoutubeVideo() - with cookies', async () => {
	assert.strictEqual(typeof _badgeUnlocker.postYoutubeVideo, 'function');
	_badgeUnlocker.setYoutubeCookies(youtubeCookies);
	const result = await _badgeUnlocker.postYoutubeVideo('test');
	assert.strictEqual(typeof result, 'number');
	assert.strictEqual(result, 1);
	// cleanup
	const _communityMock = _badgeUnlocker.getCommunity();
	_communityMock.setCookies([]);
});
it('fetchYoutubeVideos() - with cookies', async () => {
	assert.strictEqual(typeof _badgeUnlocker.fetchYoutubeVideos, 'function');
	_badgeUnlocker.setYoutubeCookies(youtubeCookies);
	const result = await _badgeUnlocker.fetchYoutubeVideos();
	assert.strictEqual(typeof result, 'object');
	assert.strictEqual(result.length, 1);
	assert.strictEqual(result[0].youtubeId, 'test2');
});
