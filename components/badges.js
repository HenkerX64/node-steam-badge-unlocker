const SteamBadgeUnlocker = require('../index');
const SteamCommunityHelpers = require('steamcommunity/components/helpers');

/**
 * @link https://partner.steamgames.com/doc/webapi/IPlayerService#GetCommunityBadgeProgress
 * @type {import('../index')['getCommunityBadgeProgress']}
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
 * @type {import('../index')['setFavoriteBadge']}
 */
SteamBadgeUnlocker.prototype.setFavoriteBadge = async function (badgeId, isCommunityItem = false) {
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

	const body = await this.post({
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
	});
	// perfect case
	if (body.match('This badge is featured on your profile')) {
		return true;
	}
	// limited account, badge unlocked & no community errors = success
	return !body.match('Feature this badge on my profile') && !!body.match('badge_info_unlocked');
}

/**
 * @link https://community.cloudflare.steamstatic.com/public/javascript/badges.js
 * @type {import('../index')['craftBadge']}
 */
SteamBadgeUnlocker.prototype.craftBadge = async function (appId, borderColor = 0, levels = 1) {
	const body = await this.post({
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
	});
	const error = SteamCommunityHelpers.eresultError(body.success);
	if (error !== null) {
		throw error;
	}
	return body;
}

/** @type {import('../index')['getAppIdsReadyForCrafting']} */
SteamBadgeUnlocker.prototype.getAppIdsReadyForCrafting = async function (pageNumber = 1) {
	const body = await this.get({
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
	});
	const apps = [];
	const pattern = /gamecards\/(\d+)\/"[^>]+>\s+Ready/;
	const matches = body.match(new RegExp(pattern, 'g'));
	if (matches) {
		for (let string of matches) {
			const [, appId] = string.match(pattern);
			apps.push(Number(appId));
		}
	}
	return apps;
}

/**
 * @link https://steamcommunity.com/my/badges/2
 * @type {import('../index')['getCommunityBadgeProgressFromProfile']}
 */
SteamBadgeUnlocker.prototype.getCommunityBadgeProgressFromProfile = async function (badgeId = 2) {
	const html = await this.get({
		url: `${this.getProfileUrl()}/badges/${badgeId}`,
		qs: {
			l: this.getLanguage(),
		},
		headers: {
			'Origin': 'https://steamcommunity.com',
			'Accept': '*/*',
			'Referer': this.getProfileUrl(),
		},
	});
	/** @type {{response: {quests?: Array<import('../index').CommunityBadgeQuest>}}} */
	const result = {response: {}};

	// Community Leader     - 500 XP (27+ completed tasks)
	if (badgeId === 2 && html.match('Completed all Steam Community tasks!')) {
		result.response.quests = getAllQuestsCompleted();
		return result;
	}

	// Pillar of Community  - 100 XP (13+ completed tasks)
	// Community Ambassador - 200 XP (21+ completed tasks)
	const quests = parseQuests(html);
	if (quests.length !== 0) {
		result.response.quests = quests;
	}
	return result;

	/**
	 * @param {string} html
	 * @returns {Array<import('../index').CommunityBadgeQuest>}
	 */
	function parseQuests(html) {
		/** @type {Array<import('../index').CommunityBadgeQuest>} */
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
	 * @returns {Array<import('../index').CommunityBadgeQuest>}
	 */
	function getAllQuestsCompleted() {
		/** @type {Array<import('../index').CommunityBadgeQuest>} */
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
