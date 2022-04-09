const SteamBadgeUnlocker = require('../../index');
const SteamCommunityMock = require('../mocks/SteamCommunityMock');
const assert = require('assert');

const _badgeUnlocker = new SteamBadgeUnlocker(new SteamCommunityMock());
it('discussionsSearch()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.discussionsSearch, 'function');
	const result = await _badgeUnlocker.discussionsSearch('test');
	assert.strictEqual(typeof result, 'string');
});
