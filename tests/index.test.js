const SteamBadgeUnlocker = require('../index');
const SteamCommunityMock = require('./lib/SteamCommunityMock');
const assert = require('assert');

const _badgeUnlocker = new SteamBadgeUnlocker(new SteamCommunityMock());
it('getSessionId()', () => {
	assert.strictEqual(typeof _badgeUnlocker.getSessionId, 'function', 'exists');
	assert.strictEqual('a0000000000000000000000f', _badgeUnlocker.getSessionId(), 'check value');
});
it('getSteamId()', () => {
	assert.strictEqual(typeof _badgeUnlocker.getSteamId, 'function', 'exists');
	assert.strictEqual('76000000000000000', _badgeUnlocker.getSteamId(), 'check value');
});
it('getLanguage()', () => {
	assert.strictEqual(typeof _badgeUnlocker.getLanguage, 'function', 'exists');
	assert.strictEqual('english', _badgeUnlocker.getLanguage(), 'check value');
});
it('getProfileUrl()', () => {
	assert.strictEqual(typeof _badgeUnlocker.getProfileUrl, 'function', 'exists');
	assert.strictEqual('https://steamcommunity.com/profiles/76000000000000000', _badgeUnlocker.getProfileUrl(), 'check default url');

	const tempObj = new SteamBadgeUnlocker(new SteamCommunityMock(), {customUrl: 'test'});
	assert.strictEqual('https://steamcommunity.com/id/test', tempObj.getProfileUrl(), 'check custom url');
});
it('get()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.get, 'function', 'exists');
	const result = await _badgeUnlocker.get({url: 'test'}).catch(() => true);
	assert.strictEqual(true, result, 'rejected');
});
it('post()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.post, 'function', 'exists');
	const result = await _badgeUnlocker.post({url: 'test'}).catch(() => true);
	assert.strictEqual(true, result, 'rejected');
});
it('getWebApiKey()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.getWebApiKey, 'function', 'exists');
	assert.strictEqual('test', await _badgeUnlocker.getWebApiKey(), 'check api key');

	const tempObj = new SteamBadgeUnlocker(new SteamCommunityMock(), {apiKey: 'ABC'});
	assert.strictEqual('ABC', await tempObj.getWebApiKey(), 'use apiKey in constructor');
});
it('getWebApiToken()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.getWebApiToken, 'function', 'exists');
	assert.strictEqual('a000000000000000000000000000000f', await _badgeUnlocker.getWebApiToken(), 'check token');

	const tempObj = new SteamBadgeUnlocker(new SteamCommunityMock(), {apiToken: 'ABC'});
	assert.strictEqual('ABC', await tempObj.getWebApiToken(), 'use apiToken in constructor');
});
