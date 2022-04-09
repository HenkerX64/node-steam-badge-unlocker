const SteamBadgeUnlocker = require('../../index');
const SteamCommunityMock = require('../mocks/SteamCommunityMock');
const assert = require('assert');

const _badgeUnlocker = new SteamBadgeUnlocker(new SteamCommunityMock());
it('generateNewDiscoveryQueue()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.generateNewDiscoveryQueue, 'function');
	const result = await _badgeUnlocker.generateNewDiscoveryQueue();
	assert.strictEqual(typeof result, 'object');
	assert.strictEqual(result.queue.length, 12);
	assert.strictEqual(result.queue[0], 100001);
});
it('clearDiscoveryQueueAppId()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.clearDiscoveryQueueAppId, 'function');
	const result = await _badgeUnlocker.clearDiscoveryQueueAppId(100001);
	assert.strictEqual(typeof result, 'string');
});
it('finishDiscoveryQueue()', () => {
	assert.strictEqual(typeof _badgeUnlocker.finishDiscoveryQueue, 'function');
	_badgeUnlocker.finishDiscoveryQueue().then(
		() => assert.ok(true),
		() => assert.ok(false),
	);
});
it('getAllContentHome()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.getAllContentHome, 'function');
	const result = await _badgeUnlocker.getAllContentHome('guides');
	assert.strictEqual(typeof result, 'string');
});

