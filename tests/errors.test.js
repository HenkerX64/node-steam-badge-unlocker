const EErrorCode = require('../resources/EErrorCode');
const SteamBadgeUnlocker = require('../index');
const {createError} = require('../components/helpers');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const runtimeFiles = ['index.js', 'classes/CCommunityLeader.js']
	.concat(fs.readdirSync(path.join(root, 'components')).map(file => 'components/' + file));

it('EErrorCode - every value equals its key', () => {
	Object.keys(EErrorCode).forEach(key => assert.strictEqual(EErrorCode[key], key));
	assert.strictEqual(SteamBadgeUnlocker.EErrorCode, EErrorCode);
});

it('createError() - code identifies the error, message defaults to the code', () => {
	const plain = createError(EErrorCode.MISSING_FILE_ID);
	assert.ok(plain instanceof Error);
	assert.strictEqual(plain.code, 'MISSING_FILE_ID');
	assert.strictEqual(plain.message, 'MISSING_FILE_ID');
	const withSteamText = createError(EErrorCode.REJECTED_COMMENT_POST, 'You\'ve been posting too frequently');
	assert.strictEqual(withSteamText.code, 'REJECTED_COMMENT_POST');
	assert.strictEqual(withSteamText.message, 'You\'ve been posting too frequently');
});

it('EErrorCode - runtime code creates errors only with createError and listed codes', () => {
	const unknown = [];
	runtimeFiles.forEach((file) => {
		const source = fs.readFileSync(path.join(root, file), 'utf8');
		if (file !== 'components/helpers.js') {
			(source.match(/new Error\(/g) || []).forEach(() => unknown.push(file + ': new Error('));
		}
		(source.match(/EErrorCode\.\w+/g) || []).filter(use => !(use.split('.')[1] in EErrorCode)).forEach(use => unknown.push(file + ': ' + use));
	});
	assert.deepStrictEqual(unknown, []);
});
