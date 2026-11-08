const SteamBadgeUnlocker = require('../index');

/** @type {import('../index')['clearDiscoveryQueueAppId']} */
SteamBadgeUnlocker.prototype.clearDiscoveryQueueAppId = function (appId, queueAppId = 10) {
	return this.post({
		url: 'https://store.steampowered.com/app/' + queueAppId,
		qs: {
			l: this.getLanguage(),
		},
		form: {
			sessionid: this.getSessionId(),
			appid_to_clear_from_queue: appId,
		},
		headers: {
			'Origin': 'https://store.steampowered.com',
			'Accept': '*/*',
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
			'Referer': 'https://store.steampowered.com/app/' + queueAppId,
			'X-Requested-With': 'XMLHttpRequest',
		},
	});
}

/**
 * @link https://store.cloudflare.steamstatic.com/public/javascript/discoveryqueue.js
 * @type {import('../index')['generateNewDiscoveryQueue']}
 */
SteamBadgeUnlocker.prototype.generateNewDiscoveryQueue = function (eQueueType = 0) {
	return this.post({
		url: 'https://store.steampowered.com/explore/generatenewdiscoveryqueue',
		qs: {
			l: this.getLanguage(),
		},
		json: true,
		form: {
			sessionid: this.getSessionId(),
			queuetype: eQueueType,
		},
		headers: {
			'Origin': 'https://store.steampowered.com',
			'Accept': '*/*',
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
			'Referer': 'https://store.steampowered.com/explore/',
			'X-Requested-With': 'XMLHttpRequest',
		},
	});
}

/** @type {import('../index')['finishDiscoveryQueue']} */
SteamBadgeUnlocker.prototype.finishDiscoveryQueue = function () {
	return this.generateNewDiscoveryQueue().then((result) => {
		/** @var {Promise[]} */
		const queue = [];
		for (let appId of result.queue) {
			queue.push(this.clearDiscoveryQueueAppId(appId));
		}

		// nodeJS <= 12 support
		const version = process.version.match(/^v?(\d+)\.(\d+)\./);
		const major = parseInt(version[1]);
		const minor = version.length >= 3 ? parseInt(version[2]) : 0;
		if (major < 12 || major === 12 && minor < 9) {
			return Promise.all(queue);
		}

		return Promise.allSettled(queue);
	}, (e) => Promise.reject(e));
}

/** @type {import('../index')['getAllContentHome']} */
SteamBadgeUnlocker.prototype.getAllContentHome = function (subSection, params = {}) {
	/** @type {import('../index').AllContentHomeQuery} */
	const qs = {
		l: this.getLanguage(),
		p: 1,
		numperpage: 1,
		appHubSubSection: SteamBadgeUnlocker.ESubSection[subSection],
		browsefilter: 'trend',
		...(params.qs || {}),
	};
	return this.get({
		url: 'https://steamcommunity.com/apps/allcontenthome/',
		qs,
		headers: {
			'Origin': 'https://steamcommunity.com',
			'Accept': '*/*',
			'Referer': 'https://steamcommunity.com' + (subSection ? '/?subsection=' + subSection : ''),
			...(params.headers || {}),
		},
	});
}
