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
let accessDenied = null;

const toText = value => typeof value === 'object' ? JSON.stringify(value) : value;

module.exports = async function (steamClient, RequestCommunity, RequestStore, SessionID, options, callback) {
	try {
		if (accessDenied) {
			options.log(`community badge: skipped, Steam blocks web requests from this IP since ${accessDenied.method} ${accessDenied.url}`);
			return;
		}
		const community = new SteamCommunity();
		community.setCookies(options.webCookie);
		if (masterCommunity === null) {
			masterCommunity = community;
			options.log('community badge: master is ready');
			return;
		}
		const unlocker = new SteamBadgeUnlocker(community);
		const leader = unlocker.createCommunityLeader({
			masterInstance: masterCommunity,
			steamUser: steamClient,
			forceAddFriend: true,
			forceRemoveFriend: true,
			log: (...values) => options.log(...values.map(toText)),
		});
		const error = await leader.start().then(() => null, rejection => rejection);
		if (error && error.code === SteamBadgeUnlocker.EErrorCode.ACCESS_DENIED) {
			accessDenied = error;
			options.logError(`community badge: Steam blocks web requests from this IP: ${error.method} ${error.url}, reference ${error.reference}`);
			return;
		}
		await leader.finish();
		if (error) {
			throw error;
		}
	} catch (error) {
		options.logError('community badge: ' + error.message);
	} finally {
		callback();
	}
};
