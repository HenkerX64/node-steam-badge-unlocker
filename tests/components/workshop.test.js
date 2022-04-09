const SteamBadgeUnlocker = require('../../index');
const SteamCommunityMock = require('../mocks/SteamCommunityMock');
const assert = require('assert');

const _badgeUnlocker = new SteamBadgeUnlocker(new SteamCommunityMock());
it('getWorkshopTrendLinks()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.getWorkshopTrendLinks, 'function');
	const result = await _badgeUnlocker.getWorkshopTrendLinks();
	assert.strictEqual(typeof result, 'object');
	assert.strictEqual(result.length, 0);
});
it('_getUgcUploadForm()', async () => {
	assert.strictEqual(typeof _badgeUnlocker._getUgcUploadForm, 'function');
	const result = await _badgeUnlocker._getUgcUploadForm();
	assert.strictEqual(typeof result, 'object');
	assert.strictEqual(result.params.wg_hmac, 'a0000000000000000000000b');
	assert.ok(/ufs\d+\.steamcontent\.com:\d+\/ugcupload/.test(result.url));
	assert.ok(/76000000000000000/.test(result.params.token));
	assert.ok(/PublishedFile_Publish/.test(result.params.wg));
});
it('uploadScreenshot()', async () => {
	assert.strictEqual(typeof _badgeUnlocker.uploadScreenshot, 'function');
	const result = await _badgeUnlocker.uploadScreenshot();
	assert.strictEqual(typeof result, 'object');
	assert.ok(result.success);
	assert.strictEqual(result.id, '1000000');
});
