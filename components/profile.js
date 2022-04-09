const SteamBadgeUnlocker = require('../index');

const SteamCommunityHelpers = require('steamcommunity/components/helpers');
const {getActionUrl} = require("./helpers");

/**
 * @param {number} appId
 * @param {number} selectedAvatar
 * @returns {Promise<true>}
 */
SteamBadgeUnlocker.prototype.selectAvatar = function (appId, selectedAvatar = 0) {
	return new Promise((resolve, reject) => {
		this.post({
			url: 'https://steamcommunity.com/ogg/' + appId + '/selectAvatar',
			qs: {
				l: this.getLanguage(),
			},
			json: true,
			form: {
				sessionid: this.getSessionId(),
				json: 1,
				selectedAvatar,
			},
			headers: {
				'Origin': 'https://steamcommunity.com',
				'Accept': 'application/json',
				'Referer': `${this.getProfileUrl()}/edit/avatar`,
				'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
			}
		}).then((body) => {
			const error = SteamCommunityHelpers.eresultError(body.success);
			if (error === null) {
				resolve(true);
				return;
			}
			reject(error);
		}, (e) => reject(e));
	});
}

/**
 * @param {string|number} itemId
 * @returns {Promise<{response:{}}>}
 */
SteamBadgeUnlocker.prototype.setProfileBackground = async function (itemId) {
	return this.post({
		url: 'https://api.steampowered.com/IPlayerService/SetProfileBackground/v1/',
		qs: {
			access_token: await this.getWebApiToken(),
		},
		json: true,
		form: {
			communityitemid: itemId,
		},
	});
}
/**
 * @returns {Promise<{response:OwnedProfileItems}>}
 */
SteamBadgeUnlocker.prototype.getOwnedProfileItems = async function () {
	return this.get({
		url: 'https://api.steampowered.com/IPlayerService/GetProfileItemsOwned/v1/',
		qs: {
			l: this.getLanguage(),
			access_token: await this.getWebApiToken(),
		},
		json: true,
	});
}

/**
 * @link https://community.cloudflare.steamstatic.com/public/javascript/blotter_functions.js
 * @returns {Promise<'null'>}
 */
SteamBadgeUnlocker.prototype.logFriendActivityUpvote = function () {
	return this.post({
		url: 'https://steamcommunity.com/actions/LogFriendActivityUpvote',
		json: false,
		form: {
			sessionID: this.getSessionId(),
		},
		headers: {
			'Origin': 'https://steamcommunity.com',
			'Accept': '*/*',
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
			'Referer': `${this.getProfileUrl()}/home/`
		},
	});
}

/**
 * @param {number} start
 * @returns {Promise<{success: boolean, blotter_html?: string, next_request?: string, timestart?: number}>}
 */
SteamBadgeUnlocker.prototype.getUserNews = function (start = null) {
	const params = {};
	if (start) {
		params.start = start;
	}
	return this.get({
		url: `${this.getProfileUrl()}/ajaxgetusernews/`,
		json: true,
		qs: {
			l: this.getLanguage(),
			...params,
		},
		headers: {
			'Origin': 'https://steamcommunity.com',
			'Accept': 'application/json',
			'Referer': `${this.getProfileUrl()}/home/`
		},
	});
}

/**
 * @param {number} minPosts
 * @returns {Promise<Array<CommentActionParams>>}
 */
SteamBadgeUnlocker.prototype.getLastFriendPosts = function (minPosts = 1) {
	return new Promise(async (resolve) => {
		/** @type {Array<CommentActionParams>} */
		const posts = [];
		const threadIdsPattern = /id="commentthread_([a-zA-Z_]+)_(\d+)_(\d+)_(\d+)?_?area"/;
		let start = null;
		do {
			const response = await this.getUserNews(start).catch(() => null);
			start = null;
			if (!response || !response.success) {
				break;
			}
			// parse start param for next request
			const startValuePattern = /^.*?start=(\d+)$/;
			if (startValuePattern.test(response.next_request)) {
				start = Number(response.next_request.replace(startValuePattern, '$1'));
			}
			// find activity posts with comment option
			const matches = response.blotter_html.match(new RegExp(threadIdsPattern, 'g'));
			if (matches && matches.length > 0) {
				for (let elementId of matches) {
					const [, type, owner, feature, feature2] = elementId.match(threadIdsPattern);
					if (owner === this.getSteamId()) {
						continue;
					}
					posts.push({
						type,           // comment_type
						owner,          // clan_steamid
						feature,        // gidfeature
						feature2,       // forum_topic_id | announcementGID | gidfeature2
					});
				}
				if (posts.length >= minPosts) {
					break;
				}
			}
		} while (start !== null);
		resolve(posts);
	});
}

/**
 * @param {{type: CommentType, action: CommentActionType, owner: string, feature: string}} params
 * @returns {Promise<SharedFilesActivityType>}
 */
SteamBadgeUnlocker.prototype.voteContent = function (params) {
	return this.post({
		url: getActionUrl(params),
		json: true,
		form: {
			vote: 1,
			count: 3,
			sessionid: this.getSessionId(),
			feature2: -1,
			newestfirstpagination: true,
		},
		headers: {
			'Origin': 'https://steamcommunity.com',
			'Accept': '*/*',
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
			'Referer': 'https://steamcommunity.com/profiles/' + this.getSteamId() + '/home/',
		}
	});
}

/**
 * @param {number} appId
 * @param {string} comment
 * @param {boolean} rateUp
 * @returns {Promise<{success: boolean, strError?: string}>}
 */
SteamBadgeUnlocker.prototype.addGameRecommendation = function (appId, comment, rateUp = true) {
	return this.post({
		url: 'https://store.steampowered.com/friends/recommendgame',
		qs: {
			l: this.getLanguage(),
		},
		json: true,
		form: {
			comment,
			appid: appId,
			disable_comments: 1,
			is_public: false,
			language: this.getLanguage(),
			rated_up: rateUp,
			received_compensation: 0,
			sessionid: this.getSessionId(),
			steamworksappid: appId
		},
		headers: {
			'Origin': 'https://store.steampowered.com',
			'Accept': 'application/json',
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
			'Referer': 'https://store.steampowered.com/app/' + appId,
			'X-Requested-With': 'XMLHttpRequest',
		}
	});
}

SteamBadgeUnlocker.prototype.deleteGameRecommendation = function (appId) {
	return this.post({
		url: `${this.getProfileUrl()}/recommended/`,
		qs: {
			l: this.getLanguage(),
		},
		followRedirect: true,
		followOriginalHttpMethod: true,
		form: {
			action: 'delete',
			appid: appId,
			sessionid: this.getSessionId(),
		},
		headers: {
			'Origin': 'https://steamcommunity.com',
			'Accept': '*/*',
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
			'Referer': `${this.getProfileUrl()}/recommended/${appId}`,
			'X-Requested-With': 'XMLHttpRequest',
		}
	});
}

/** @typedef {{communityitemid: string, image_large: string, name: string, item_title: string, item_description: string, appid: number, item_type: number, item_class: number, movie_webm?: string, movie_mp4?: string, movie_webm_small?: string, movie_mp4_small?: string}} ProfileBackgroundItem */
/** @typedef {{profile_backgrounds: Array<ProfileBackgroundItem>, mini_profile_backgrounds: Array<ProfileBackgroundItem>, avatar_frames: Array<ProfileBackgroundItem>}} OwnedProfileItems */
/** @typedef {{success: boolean, name: string, start: number, pagesize: string, total_count: number, upvotes: number, has_upvoted: number, comments_html: string, timelastpost: number, votetext?: string }} SharedFilesActivityType */
