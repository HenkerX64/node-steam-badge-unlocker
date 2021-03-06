const SteamBadgeUnlocker = require('../../index');
const SteamCommunityMock = require('../mocks/SteamCommunityMock');
const assert = require('assert');

const _badgeUnlocker = new SteamBadgeUnlocker(new SteamCommunityMock());
it('getCommunityBadgeProgress()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.getCommunityBadgeProgress, 'function');
	const result = await _badgeUnlocker.getCommunityBadgeProgress('test');
	assert.strictEqual(typeof result, 'object');
	assert.strictEqual(result.response.quests.length, 28);
	assert.strictEqual(result.response.quests[0].questid, 115);
});
it('setFavoriteBadge()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.setFavoriteBadge, 'function');
	const result = await _badgeUnlocker.setFavoriteBadge(2);
	assert.strictEqual(result, true);
});
it('craftBadge()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.craftBadge, 'function');
	let thrownError = false;
	try {
		await _badgeUnlocker.craftBadge(730);
	} catch (e) {
		thrownError = true;
	}
	assert.ok(thrownError, 'Craft badge should trigger an error 500.');
	const result = await _badgeUnlocker.craftBadge(1000);
	assert.strictEqual(typeof result, 'object');
	assert.strictEqual(result.success, 1);
});
it('getAppIdsReadyForCrafting()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.getAppIdsReadyForCrafting, 'function');
	const result = await _badgeUnlocker.getAppIdsReadyForCrafting();
	assert.strictEqual(typeof result, 'object');
	assert.strictEqual(result[0], 1000);
});
it('getCommunityBadgeProgressFromProfile()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.getCommunityBadgeProgressFromProfile, 'function');
	const result = await _badgeUnlocker.getCommunityBadgeProgressFromProfile();
	assert.strictEqual(typeof result, 'object');
	assert.strictEqual(result.response.quests.length, 28);
	assert.ok(result.response.quests[0].questid, 115);
});

