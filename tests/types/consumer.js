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

module.exports = {setRealName};
