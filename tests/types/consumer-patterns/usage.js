const Unlocker = require('steam-badge-unlocker');
const {createError} = require('steam-badge-unlocker/components/helpers');
const ECommunityBadgeQuests = require('steam-badge-unlocker/resources/ECommunityBadgeQuests');

/**
 * @param {SteamBadgeUnlocker} unlocker
 * @returns {void}
 */
function confirmWithCommunity(unlocker) {
	unlocker.getCommunity().acceptConfirmationForObject('secret', '1', () => undefined);
	// @ts-expect-error a method SteamBadgeUnlocker does not have
	unlocker.notAMethod();
}

/**
 * @param {import('steamcommunity')} community
 * @returns {SteamBadgeUnlocker}
 */
function createUnlocker(community) {
	return new Unlocker(community);
}

/**
 * @param {import('steamcommunity')} community
 * @returns {void}
 */
function confirmWithNewUnlocker(community) {
	confirmWithCommunity(createUnlocker(community));
}

/**
 * @param {import('steam-badge-unlocker')} plain
 * @returns {import('steam-badge-unlocker').SteamCommunityLike}
 */
function plainCommunity(plain) {
	const community = plain.getCommunity();
	// @ts-expect-error SteamCommunityLike has no acceptConfirmationForObject
	community.acceptConfirmationForObject('secret', '1', () => undefined);
	return community;
}

/**
 * @param {SteamBadgeUnlocker} unlocker
 * @returns {Promise<string>}
 */
async function readBody(unlocker) {
	const body = await unlocker.get({uri: 'https://steamcommunity.com/'});
	return body.anyProperty;
}

/** @type {'MISSING_FILE_ID'} */
const missingFileId = createError('MISSING_FILE_ID').code;

/** @type {string | undefined} */
const joinGroupName = ECommunityBadgeQuests[101];

module.exports = {confirmWithNewUnlocker, plainCommunity, readBody, missingFileId, joinGroupName};
