const SteamBadgeUnlocker = require('../../index');
const SteamCommunityMock = require('../lib/SteamCommunityMock');
const assert = require('assert');

const _badgeUnlocker = new SteamBadgeUnlocker(new SteamCommunityMock());
it('makeNavCookie()', () => {
	assert.strictEqual(typeof _badgeUnlocker.makeNavCookie, 'function');
	_badgeUnlocker.makeNavCookie('1_direct-navigation__', 'https://store.steampowered.com');
	const _communityMock = _badgeUnlocker.getCommunity();
	assert.strictEqual(_communityMock._cookies.length, 1);
	assert.strictEqual(_communityMock._cookies.filter(cookie => cookie.match(/snr=1_direct-navigation__.*steampowered/)).length, 1);
	// cleanup
	_communityMock.setCookies([]);
});
it('addToWishlist()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.addToWishlist, 'function');
	const _communityMock = _badgeUnlocker.getCommunity();
	assert.strictEqual(_communityMock._cookies.length, 0);
	const result = await _badgeUnlocker.addToWishlist(730);
	assert.strictEqual(typeof result, 'object');
	assert.strictEqual(result.success, true);
	assert.strictEqual(result.wishlistCount, 1);
	assert.strictEqual(_communityMock._cookies.length, 1);
	// cleanup
	_communityMock.setCookies([]);
});
it('removeFromWishlist()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.removeFromWishlist, 'function');
	const _communityMock = _badgeUnlocker.getCommunity();
	assert.strictEqual(_communityMock._cookies.length, 0);
	const result = await _badgeUnlocker.removeFromWishlist(730);
	assert.strictEqual(typeof result, 'object');
	assert.strictEqual(result.success, true);
	assert.strictEqual(result.wishlistCount, 0);
	assert.strictEqual(_communityMock._cookies.length, 1);
	// cleanup
	_communityMock.setCookies([]);
});

