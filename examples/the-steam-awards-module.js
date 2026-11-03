/**
 * Module for https://github.com/quer/the-steam-awards: copy it to `modules/CommunityBadge.js` and add
 * `modules.push('CommunityBadge');` to `main.js`. Install `steam-badge-unlocker` and `steamcommunity`.
 *
 * The first account becomes the master: the friend of every following account; it runs no quests itself and
 * its newest screenshot must be public. The core logs the master off after its modules; the following
 * accounts keep using the master's web cookies. Needs the default RunningMode Single (one account after another);
 * with many accounts set RunningMode.DelayBetweenAccountModes in lib/Settings.js to pace the logins (ms, e.g. 10000).
 * Objects in the run log are written as JSON, so the core's log files show them.
 */
const SteamCommunity = require('steamcommunity');
const SteamBadgeUnlocker = require('steam-badge-unlocker');

let masterCommunity = null;

const toText = value => typeof value === 'object' ? JSON.stringify(value) : value;

module.exports = async function (steamClient, RequestCommunity, RequestStore, SessionID, options, callback) {
	try {
		const community = new SteamCommunity();
		community.setCookies(options.webCookie);
		if (masterCommunity === null) {
			masterCommunity = community;
			options.log('community badge: master is ready');
			return;
		}
		const leader = new SteamBadgeUnlocker(community).createCommunityLeader({
			masterInstance: masterCommunity,
			steamUser: steamClient,
			forceAddFriend: true,
			forceRemoveFriend: true,
			log: (...values) => options.log(...values.map(toText)),
		});
		try {
			await leader.start();
		} finally {
			await leader.finish();
		}
	} catch (error) {
		options.logError('community badge: ' + error.message);
	} finally {
		callback();
	}
};
