const SteamBadgeUnlocker = require('../index');

/**
 * @param {number} appId
 * @param {number} queueAppId
 * @returns {Promise<string>}
 */
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
 * @param {number} eQueueType
 * @returns {Promise<DiscoveryQueueResult>}
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

/**
 * @returns {Promise<Array<PromiseSettledResult<Awaited<string>>>>}
 */
SteamBadgeUnlocker.prototype.finishDiscoveryQueue = function () {
	return this.generateNewDiscoveryQueue().then((result) => {
		/** @var {Promise[]} */
		const queue = [];
		for (let appId of result.queue) {
			queue.push(this.clearDiscoveryQueueAppId(appId));
		}
		return Promise.allSettled(queue);
	}, (e) => Promise.reject(e));
}

/**
 * @param {ESubSectionType} subSection
 * @param {{qs?: AllContentHomeQuery, headers?: module:http.IncomingHttpHeaders}} params
 * @returns {Promise<string>}
 */
SteamBadgeUnlocker.prototype.getAllContentHome = function (subSection, params = {}) {
	/** @type {AllContentHomeQuery} */
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

/** @typedef {{
 * browsesort?: 'Alphabetical'|'MostRecent'|'Trend',
 * browsefilter?: 'alphabetical'|'mostrecent'|'trend',
 * appHubSubSection?: number,
 * userreviewsoffset?: number,
 * broadcastsoffset?: number,
 * workshopitemspage?: number,
 * readytouseitemspage?: number,
 * mtxitemspage?: number,
 * itemspage?: number,
 * screenshotspage?: number,
 * videospage?: number,
 * artpage?: number,
 * allguidepage?: number,
 * webguidepage?: number,
 * integratedguidepage?: number,
 * discussionspage?: number,
 * numperpage?: number,
 * appid?: number,
 * p?: number,
 * l?: string,
 * }} AllContentHomeQuery */

/** @typedef {{
 * queue: number[],
 * settings: DiscoveryQueueSettings,
 * rgAppData: Object.<string, DiscoveryQueueAppData>,
 * }} DiscoveryQueueResult
 */

/** @typedef {{
 * os_win: null|0|1,
 * os_mac: null|0|1,
 * os_linux: null|0|1,
 * full_controller_support: null|0|1,
 * native_steam_controller: null|0|1,
 * include_coming_soon: null|0|1,
 * excluded_tagids: number[],
 * exclude_early_access: null|0|1,
 * exclude_videos: null|0|1,
 * exclude_software: null|0|1,
 * exclude_dlc: null|0|1,
 * exclude_soundtracks: null|0|1,
 * featured_tagids: number[],
 * }} DiscoveryQueueSettings
 */

/** @typedef {{
 * name: string,
 * url_name: string,
 * discount_block: string,
 * descids: number[],
 * header: string,
 * os_windows: boolean,
 * has_live_broadcast: boolean,
 * discount: boolean,
 * localized: boolean,
 * }} DiscoveryQueueAppData
 */
