const SteamBadgeUnlocker = require('../index');
const SteamCommunityHelpers = require('steamcommunity/components/helpers');

/**
 * @link https://partner.steamgames.com/doc/webapi/IPlayerService#GetCommunityBadgeProgress
 * @param {string} apiKey
 * @param {number} badgeId
 * @returns {Promise<{response: {quests?: CommunityBadgeQuest[]}}>}
 */
SteamBadgeUnlocker.prototype.getCommunityBadgeProgress = function (apiKey, badgeId = 2) {
	return this.get({
		url: 'https://api.steampowered.com/IPlayerService/GetCommunityBadgeProgress/v1/',
		qs: {
			key: apiKey,
			steamid: this.getSteamId(),
			badgeid: badgeId,
		},
		json: true,
	});
}

/**
 * @link https://steamcommunity.com/my/badges/2
 * @param {number} badgeId
 * @param {boolean} isCommunityItem
 * @returns {Promise<boolean>}
 */
SteamBadgeUnlocker.prototype.setFavoriteBadge = function (badgeId, isCommunityItem = false) {
	const url = `${this.getProfileUrl()}/` + (isCommunityItem ? 'gamecards/' : 'badges');
	const form = {
		action: 'setfavoritebadge',
		sessionid: this.getSessionId(),
	};
	if (isCommunityItem) {
		form.communityitemid = badgeId;
	} else {
		form.badgeid = badgeId;
	}

	return new Promise((resolve, reject) => {
		this.post({
			url,
			qs: {
				l: this.getLanguage(),
			},
			followAllRedirects: true,
			form,
			headers: {
				'Origin': 'https://steamcommunity.com',
				'Accept': '*/*',
				'Referer': url,
				'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
			}
		}).then((body) => {
			// perfect case
			if (body.match('This badge is featured on your profile')) {
				resolve(true);
				return;
			}
			// limited account, badge unlocked & no community errors = success
			if (!body.match('Feature this badge on my profile') && body.match('badge_info_unlocked')) {
				resolve(true);
				return;
			}
			resolve(false);
		}, (e) => reject(e));
	});
}

/**
 * @link https://community.cloudflare.steamstatic.com/public/javascript/badges.js
 * @param {number} appId
 * @param {0|1} borderColor
 * @param {number} levels
 * @returns {Promise<CraftBadgeResponse>}
 */
SteamBadgeUnlocker.prototype.craftBadge = function (appId, borderColor = 0, levels = 1) {
	return new Promise((resolve, reject) => {
		this.post({
			url: `${this.getProfileUrl()}/ajaxcraftbadge/`,
			qs: {
				l: this.getLanguage(),
			},
			json: true,
			form: {
				appid: appId,
				series: 1,
				border_color: borderColor,
				levels,
				sessionid: this.getSessionId(),
			},
			headers: {
				'Origin': 'https://steamcommunity.com',
				'Referer': `${this.getProfileUrl()}/gamecards/${appId}/`,
			}
		}).then(body => {
			const error = SteamCommunityHelpers.eresultError(body.success);
			if (error === null) {
				resolve(body);
				return;
			}
			reject(error);
		}, (e) => reject(e));
	});
}

/**
 * @param {number} pageNumber
 * @returns {Promise<Array<number>>}
 */
SteamBadgeUnlocker.prototype.getAppIdsReadyForCrafting = function (pageNumber = 1) {
	return new Promise((resolve, reject) => {
		this.get({
			url: `${this.getProfileUrl()}/badges/`,
			qs: {
				l: this.getLanguage(),
				sort: 'p',
				p: pageNumber,
			},
			headers: {
				'Origin': 'https://steamcommunity.com',
				'Referer': `${this.getProfileUrl()}/badges/`,
			}
		}).then(body => {
			const apps = [];
			const pattern = /gamecards\/(\d+)\/"[^>]+>\s+Ready/;
			const matches = body.match(new RegExp(pattern, 'g'));
			if (matches) {
				for (let string of matches) {
					const [, appId] = string.match(pattern);
					apps.push(Number(appId));
				}
			}
			resolve(apps);
		}, (e) => reject(e));
	});
}

/**
 * @link https://steamcommunity.com/my/badges/2
 * @param {number} badgeId
 * @returns {Promise<{response: {quests?: Array<CommunityBadgeQuest>}}>}
 */
SteamBadgeUnlocker.prototype.getCommunityBadgeProgressFromProfile = function (badgeId = 2) {
	return new Promise((resolve, reject) => {
		this.get({
			url: `${this.getProfileUrl()}/badges/${badgeId}`,
			qs: {
				l: this.getLanguage(),
			},
			headers: {
				'Origin': 'https://steamcommunity.com',
				'Accept': '*/*',
				'Referer': this.getProfileUrl(),
			},
		}).then((html) => {
			/** @type {{response: {quests?: Array<CommunityBadgeQuest>}}} */
			const result = {response: {}};

			// Community Leader     - 500 XP (27+ completed tasks)
			if (badgeId === 2 && html.match('Completed all Steam Community tasks!')) {
				result.response.quests = getAllQuestsCompleted();
				resolve(result);
				return;
			}

			// Pillar of Community  - 100 XP (13+ completed tasks)
			// Community Ambassador - 200 XP (21+ completed tasks)
			const quests = parseQuests(html);
			if (quests.length !== 0) {
				result.response.quests = quests;
			}
			resolve(result);
		}, (e) => reject(e));
	});

	/**
	 * @param {string} html
	 * @returns {Array<CommunityBadgeQuest>}
	 */
	function parseQuests(html) {
		/** @type {Array<CommunityBadgeQuest>} */
		const quests = [];
		const pattern = /http[^"]+\/([^/]+)_(on|off)\.(png|jpg)/;
		const questIcons = html.match(new RegExp(pattern, 'g'));
		if (questIcons) {
			for (let url of questIcons) {
				const [, questName, questStatus] = url.match(pattern);
				quests.push({
					questid: SteamBadgeUnlocker.ECommunityBadgeQuests[questName],
					completed: (questStatus === 'on'),
				});
			}
		}

		return quests;
	}

	/**
	 * @returns {Array<CommunityBadgeQuest>}
	 */
	function getAllQuestsCompleted() {
		/** @type {Array<CommunityBadgeQuest>} */
		const quests = [];
		const completed = true;
		for (let questName in SteamBadgeUnlocker.ECommunityBadgeQuests) {
			const questid = SteamBadgeUnlocker.ECommunityBadgeQuests[questName];
			if (typeof questid !== 'number') {
				continue;
			}
			quests.push({
				questid,
				completed,
			});
		}

		return quests;
	}
}


/** @typedef {{questid: number, completed: boolean}} CommunityBadgeQuest */
/** @typedef {{game: string, image: string, title: string, unlocked_time: number, xp: string}} CraftedBadgeType */
/** @typedef {{description: string, economy_hover_data: string, image: string, label: string, title: string}} CraftedDroppedItemType */
/** @typedef {{Badge: CraftedBadgeType, rgDroppedItems: Array<CraftedDroppedItemType>, success: number}} CraftBadgeResponse */

