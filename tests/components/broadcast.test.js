const SteamBadgeUnlocker = require('../../index');
const SteamCommunityMock = require('../mocks/SteamCommunityMock');
const assert = require('assert');

const _badgeUnlocker = new SteamBadgeUnlocker(new SteamCommunityMock());
it('getBroadcastManifest()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.getBroadcastManifest, 'function');
	const result = await _badgeUnlocker.getBroadcastManifest(_badgeUnlocker.getSteamId());
	assert.strictEqual(typeof result, 'object');
	assert.strictEqual(result.success, 'ready');
});
it('getBroadcastTrendLinks()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.getBroadcastTrendLinks, 'function');
	const result = await _badgeUnlocker.getBroadcastTrendLinks();
	assert.strictEqual(typeof result, 'object');
	assert.strictEqual(result.length, 1);
	assert.strictEqual(result[0].watchId, '76000000000000001');
});

