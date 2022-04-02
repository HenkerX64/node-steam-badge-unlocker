const SteamBadgeUnlocker = require('../../index');
const SteamCommunityMock = require('../lib/SteamCommunityMock');
const assert = require('assert');

const _badgeUnlocker = new SteamBadgeUnlocker(new SteamCommunityMock());
it('subscribeToSharedFile()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.subscribeToSharedFile, 'function');
	const result = await _badgeUnlocker.subscribeToSharedFile('1000', 730);
	assert.strictEqual(typeof result, 'boolean');
	assert.ok(result);
});

it('unsubscribeFromSharedFile()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.unsubscribeFromSharedFile, 'function');
	const result = await _badgeUnlocker.unsubscribeFromSharedFile('1000', 730);
	assert.strictEqual(typeof result, 'boolean');
	assert.ok(result);
});

it('voteSharedFile()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.voteSharedFile, 'function');
	const resultUp = await _badgeUnlocker.voteSharedFile('1000', true);
	assert.strictEqual(typeof resultUp, 'boolean');
	assert.ok(resultUp);
	const resultDown = await _badgeUnlocker.voteSharedFile('1000', false);
	assert.strictEqual(typeof resultDown, 'boolean');
	assert.ok(resultDown);
});

it('getSharedFileDetails()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.getSharedFileDetails, 'function');
	const result = await _badgeUnlocker.getSharedFileDetails('1000', 730);
	assert.strictEqual(typeof result, 'string');
});
it('deleteSharedFile()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.deleteSharedFile, 'function');
	const result = await _badgeUnlocker.deleteSharedFile('1000');
	assert.strictEqual(typeof result, 'boolean');
	assert.ok(result);
});
it('postSharedFileComment()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.postSharedFileComment, 'function');
	const result = await _badgeUnlocker.postSharedFileComment('76000000000000001', '1000', 'test');
	assert.strictEqual(typeof result, 'string');
	assert.strictEqual(result, '1001');
});
it('deleteSharedFileComment()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.deleteSharedFileComment, 'function');
	const result = await _badgeUnlocker.deleteSharedFileComment('76000000000000001', '1000', '1001');
	assert.strictEqual(typeof result, 'boolean');
	assert.ok(result);
});


