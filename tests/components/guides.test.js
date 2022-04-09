const SteamBadgeUnlocker = require('../../index');
const SteamCommunityMock = require('../mocks/SteamCommunityMock');
const assert = require('assert');

const _badgeUnlocker = new SteamBadgeUnlocker(new SteamCommunityMock());
it('getGuidesTrendLinks()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.getGuidesTrendLinks, 'function');
	const result = await _badgeUnlocker.getGuidesTrendLinks();
	assert.strictEqual(typeof result, 'object');
	assert.strictEqual(result.length, 0);
});
