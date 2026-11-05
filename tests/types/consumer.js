const SteamBadgeUnlocker = require('steam-badge-unlocker');
const {delay, isSteamId} = require('steam-badge-unlocker/components/helpers');

/**
 * @param {SteamBadgeUnlocker.SteamCommunityLike} community
 * @returns {Promise<{validSteamId: boolean, realNameSet: boolean, skipCode: SteamBadgeUnlocker.ErrorCode}>}
 */
async function setRealName(community) {
	const leader = new SteamBadgeUnlocker(community).createCommunityLeader({realName: 'John'});
	await delay(1);
	return {
		validSteamId: isSteamId('76561197960287930'),
		realNameSet: await leader.SetupCommunityRealName(),
		skipCode: SteamBadgeUnlocker.EErrorCode.SKIP_MISSING_STEAM_USER,
	};
}

/** @typedef {SteamBadgeUnlocker.SteamCommunityLike & {acceptConfirmationForObject(identitySecret: string, objectId: string, callback: (error: Error | null) => void): void}} FullCommunity */
/** @typedef {import('steam-badge-unlocker')<FullCommunity>} TypedUnlocker */

/**
 * @param {TypedUnlocker} unlocker
 * @returns {void}
 */
function confirm(unlocker) {
	unlocker.getCommunity().acceptConfirmationForObject('secret', '1', () => undefined);
}

/**
 * @param {import('steam-badge-unlocker')} unlocker
 * @param {SteamBadgeUnlocker.ReadableLike} screenshot
 * @returns {Promise<{id: string, openQuests: number}>}
 */
async function uploadAndCountOpenQuests(unlocker, screenshot) {
	const upload = await unlocker.uploadScreenshot(767, 'title', '', screenshot);
	const progress = await unlocker.getCommunityBadgeProgressFromProfile(2);
	return {id: upload.id, openQuests: (progress.response.quests || []).filter(quest => !quest.completed).length};
}

module.exports = {setRealName, confirm, uploadAndCountOpenQuests};
