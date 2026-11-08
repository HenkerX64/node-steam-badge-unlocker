const SteamBadgeUnlocker = require('../index');

/**
 * @link https://community.cloudflare.steamstatic.com/public/javascript/broadcast_watch.js
 * @type {import('../index')['getBroadcastManifest']}
 */
SteamBadgeUnlocker.prototype.getBroadcastManifest = function (steamId) {
	return this.get({
		url: 'https://steamcommunity.com/broadcast/getbroadcastmpd/',
		qs: {
			l: this.getLanguage(),
			steamid: steamId,
			sessionid: this.getSessionId(),
			broadcastid: 0,
			viewertoken: 0,
			watchlocation: 5,
		},
		json: true,
		headers: {
			'Origin': 'https://steamcommunity.com',
			'Referer': 'https://steamcommunity.com/broadcast/watch/' + steamId
		},
	});
}

/** @type {import('../index')['getBroadcastTrendLinks']} */
SteamBadgeUnlocker.prototype.getBroadcastTrendLinks = async function (params = {}) {
	const body = await this.getAllContentHome('broadcasts', params);
	/** @type {Array<import('../index').BroadcastLink>} */
	const links = [];
	const pattern = /https?:\/\/(www\.)?steamcommunity\.com\/broadcast\/watch\/(\d+)/;
	const matches = body.match(new RegExp(pattern, 'g'));
	if (matches) {
		for (let link of matches) {
			const match = link.match(pattern);
			links.push({
				url: match[0],
				watchId: match[2],
			});
		}
	}

	return links;
}
