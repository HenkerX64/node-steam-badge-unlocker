const SteamBadgeUnlocker = require('../index');
const SteamCommunityMock = require('./mocks/SteamCommunityMock');
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
it('getWebApiKey() - the dev/apikey request sends Accept-Language', async () => {
	const community = new SteamCommunityMock();
	const acceptLanguages = [];
	community.getWebApiKey = (domain, callback) => {
		const options = {};
		community.onPreHttpRequest(1, 'steamcommunity', options, () => null);
		acceptLanguages.push(options.headers['Accept-Language']);
		callback(null, 'KEY');
	};
	assert.strictEqual(await new SteamBadgeUnlocker(community).getWebApiKey(), 'KEY');
	assert.deepStrictEqual(acceptLanguages, ['en-US,en;q=0.9']);
	assert.ok(!('onPreHttpRequest' in community));
});
it('get() - rejects with ACCESS_DENIED when Akamai denies the request', async () => {
	const community = new SteamCommunityMock();
	const page = require('fs').readFileSync(__dirname + '/fixtures/pages/akamai-access-denied.html', 'utf8');
	community.setResultStack([[Object.assign(new Error('HTTP error 403'), {code: 403}), {statusCode: 403, headers: {server: 'AkamaiGHost'}}, page]]);
	const error = await new SteamBadgeUnlocker(community).get({url: 'https://steamcommunity.com/market/', qs: {l: 'english'}}).catch(rejection => rejection);
	assert.deepStrictEqual(
		{code: error.code, reference: error.reference, url: error.url, method: error.method},
		{code: 'ACCESS_DENIED', reference: '18.202c1102.1793901546.74e95e7', url: 'https://steamcommunity.com/market/', method: 'GET'},
	);
});
it('getWebApiToken()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.getWebApiToken, 'function', 'exists');
	assert.strictEqual(
		'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA0AAAA0.AAAAAAAAAAAAAAA0AAAAAA0AAAAAAAA0A00AAAAAAAAAAAAAAAAAAAAAAAA0AAAAAAAAAAAAAAA0AAAAAAAAAAAAAAAAAAAAA0AAAAA0A0AAAAAAAAAAAAAAAAAAAAA0AAA0AAAAAAAAAA0AAAA0AAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA0AAAAAAAAAAA0A0AAAAAAA0AAAAAAA0AAAAAAA0A0A0AAA0AAA0AAA0AAA0AAAAAAAAAAAAAAAAAAAAAAAAA0AAAAAAAAA0AAA0AA0AAAAAAAA0AAA0AAAAAAAAAA0AA00AAAAAAAAAAAAAAAAAAAA0AAA0AA0AAAAAAA0.AAAAAAAAAAAA0AAAAAAAAAAAAA0AAAAA0AA0AAAAAAAAAAAAA-0A0A0AAAAAA00AAAAAA-AAAA-aaaaa0a0aaa',
		await _badgeUnlocker.getWebApiToken(),
		'check token',
	);

	const tempObj = new SteamBadgeUnlocker(new SteamCommunityMock(), {apiToken: 'ABC'});
	assert.strictEqual('ABC', await tempObj.getWebApiToken(), 'use apiToken in constructor');
});
