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
it('uploadScreenshot() - unreadable file rejects instead of crashing the process', async () => {
	const community = new SteamCommunityMock();
	const httpRequest = community.httpRequest;
	community.httpRequest = (params, callback, source) => setTimeout(() => httpRequest(params, callback, source), 50);
	const unlocker = new SteamBadgeUnlocker(community);
	const file = require('fs').createReadStream(__dirname + '/../fixtures/missing-screenshot.png');
	const result = await unlocker.uploadScreenshot(767, 'title', '', file).then(() => 'resolved', error => error.code);
	assert.strictEqual(result, 'ENOENT');
});
it('uploadScreenshot() - closes the file when the upload fails', async () => {
	const community = new SteamCommunityMock();
	community.setResultStack([[Object.assign(new Error('HTTP error 429'), {code: 429}), {statusCode: 429}, null]]);
	const unlocker = new SteamBadgeUnlocker(community);
	const file = require('fs').createReadStream(__dirname + '/../../resources/empty.png');
	const result = await unlocker.uploadScreenshot(767, 'title', '', file).then(() => 'resolved', error => error.code);
	assert.strictEqual(result, 429);
	assert.strictEqual(file.destroyed, true);
});
it('uploadScreenshot() - visibility is an EPublishedFileVisibility value, private by default', async () => {
	const community = new SteamCommunityMock();
	const sentVisibility = [];
	const httpRequest = community.httpRequest;
	community.httpRequest = (params, callback, source) => {
		if (params.formData) {
			sentVisibility.push(params.formData.visibility);
		}
		httpRequest(params, callback, source);
	};
	const unlocker = new SteamBadgeUnlocker(community);
	await unlocker.uploadScreenshot(767, 'title', '', null);
	await unlocker.uploadScreenshot(767, 'title', '', null, SteamBadgeUnlocker.EPublishedFileVisibility.Public);
	assert.deepStrictEqual(sentVisibility, [2, 0]);
});
