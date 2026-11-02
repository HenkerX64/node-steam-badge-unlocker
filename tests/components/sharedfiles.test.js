const SteamBadgeUnlocker = require('../../index');
const SteamCommunityMock = require('../mocks/SteamCommunityMock');
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


it('postSharedFileComment() - Steam error text as message', async () => {
	_badgeUnlocker.getCommunity().setResultStack([[null, null, {success: false, error: 'You\'ve been posting too frequently'}]]);
	const error = await _badgeUnlocker.postSharedFileComment('76000000000000001', '1000', 'test').catch(e => e);
	assert.strictEqual(error.code, 'REJECTED_COMMENT_POST');
	assert.strictEqual(error.message, 'You\'ve been posting too frequently');
});
it('deleteSharedFileComment() - comment still present', async () => {
	_badgeUnlocker.getCommunity().setResultStack([[null, null, {success: true, comments_html: '<div id="comment_1001"></div>'}]]);
	const result = await Promise.race([
		_badgeUnlocker.deleteSharedFileComment('76000000000000001', '1000', '1001').catch(e => e.code),
		new Promise(resolve => setTimeout(() => resolve('timeout'), 500)),
	]);
	assert.strictEqual(result, 'REJECTED_COMMENT_DELETE');
});
it('deleteSharedFileComment() - response without comments_html', async () => {
	for (const body of [{success: false}, '<html lang="en"></html>']) {
		_badgeUnlocker.getCommunity().setResultStack([[null, null, body]]);
		const result = await Promise.race([
			_badgeUnlocker.deleteSharedFileComment('76000000000000001', '1000', '1001').catch(e => e.code),
			new Promise(resolve => setTimeout(() => resolve('timeout'), 500)),
		]);
		assert.strictEqual(result, 'UNKNOWN_COMMENT_DELETE');
	}
});
it('postSharedFileComment() - success without comments_html', async () => {
	_badgeUnlocker.getCommunity().setResultStack([[null, null, {success: true}]]);
	const result = await Promise.race([
		_badgeUnlocker.postSharedFileComment('76000000000000001', '1000', 'test').then(() => 'resolved', error => error.code),
		new Promise(resolve => setTimeout(() => resolve('timeout'), 500)),
	]);
	assert.strictEqual(result, 'ON_SUCCESS_ID_NOT_FOUND');
});
