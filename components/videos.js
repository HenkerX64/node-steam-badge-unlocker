const SteamBadgeUnlocker = require('../index');
const EErrorCode = require('../resources/EErrorCode');
const {createError} = require('./helpers');


/**
 * @param {string} html
 * @returns {Array<import('../index').ProfileVideo>}
 */
function parseProfileVideos(html) {
	const result = [];
	const pattern = /"video_item"(.|\n)*?<a.*?filedetails\/\?id=([0-9]+)"(.|\n)*?src="[^"]+\/vi\/([^/]+)\/(.|\n)*?<\/a>/;
	const videoItemsMatches = html.match(new RegExp(pattern, 'g'));
	if (videoItemsMatches && videoItemsMatches.length > 0) {
		for (let item of videoItemsMatches) {
			const linkSplit = item.match(pattern);
			result.push({
				fileId: linkSplit[2],
				youtubeId: linkSplit[4],
			})
		}
	}
	return result;
}

/**
 * Get already shared videos from current steam profile.
 *
 * @type {import('../index')['getProfileVideos']}
 */
SteamBadgeUnlocker.prototype.getProfileVideos = async function (params = {}) {
	const html = await this.get({
		url: `${this.getProfileUrl()}/videos/`,
		qs: {
			l: this.getLanguage(),
			appid: 0,
			sort: 'newestfirst',
			browsefilter: 'myfiles',
			privacy: 30,
			...(params.qs || {}),
		},
		followAllRedirects: true,
		headers: {
			'Origin': 'https://steamcommunity.com',
			'Accept': '*/*',
			'Referer': `${this.getProfileUrl()}/videos/`,
		}
	});
	return parseProfileVideos(html);
}

/**
 * Fetch most recent available YouTube videos to share.
 *
 * @note You need to assign YouTube accessToken cookie before using this.
 * @see SteamBadgeUnlocker.setYoutubeCookies
 * @type {import('../index')['fetchYoutubeVideos']}
 */
SteamBadgeUnlocker.prototype.fetchYoutubeVideos = async function () {
	const html = await this.get({
		url: `${this.getProfileUrl()}/videos/add/`,
		qs: {
			l: this.getLanguage(),
			ls: 1,
		},
		followAllRedirects: true,
		headers: {
			'Origin': 'https://steamcommunity.com',
			'Accept': '*/*',
			'Referer': `${this.getProfileUrl()}/videos/`,
		}
	});
	const result = [];
	const pattern = /name="videos\[]"\s+value="([^"]+)"/;
	const checkboxMatches = html.match(new RegExp(pattern, 'g'));
	if (checkboxMatches && checkboxMatches.length > 0) {
		for (let checkbox of checkboxMatches) {
			result.push({youtubeId: checkbox.match(pattern)[1]});
		}
	}
	return result;
}

/**
 * Add public YouTube videos to steam profile.
 *
 * @note You need to assign YouTube accessToken cookie before using this.
 * @see SteamBadgeUnlocker.setYoutubeCookies
 * @type {import('../index')['postYoutubeVideo']}
 */
SteamBadgeUnlocker.prototype.postYoutubeVideo = async function (youtubeIds, appId = 0, otherAssoc = '') {
	const videoIds = typeof youtubeIds === 'string' ? [youtubeIds] : youtubeIds;
	const html = await this.post({
		url: `${this.getProfileUrl()}/videosactions/add`,
		qs: {
			l: this.getLanguage(),
		},
		followAllRedirects: true,
		form: {
			action: 'add',
			sessionid: this.getSessionId(),
			videos: videoIds,
			app_assoc: appId,
			other_assoc: otherAssoc,
		},
		headers: {
			'Origin': 'https://steamcommunity.com',
			'Accept': '*/*',
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
			'Referer': `${this.getProfileUrl()}/videos/add/?ls=1`,
		}
	});
	const addedMatches = html.match(/Successfully added (\d+) video/);
	if (addedMatches && addedMatches.length > 0) {
		return Number(addedMatches[1]);
	}
	if (html.match('Access your YouTube videos')) {
		throw createError(EErrorCode.INVALID_YOUTUBE_ACCESS_TOKEN);
	}
	const sharedIds = parseProfileVideos(html).map(video => video.youtubeId);
	return videoIds.filter(id => sharedIds.indexOf(id) !== -1).length;
}

/**
 * @see https://steamcommunity.com/my/videos/link
 * @type {import('../index')['setYoutubeCookies']}
 */
SteamBadgeUnlocker.prototype.setYoutubeCookies = function (cookies) {
	if (!cookies || !cookies.accessToken) {
		throw createError(EErrorCode.MISSING_YOUTUBE_ACCESS_TOKEN);
	}
	const cookieStrings = [
		'youtube_accesstoken=' + decodeURI(cookies.accessToken) + ';path=/',
	];
	if (cookies.authAccount) {
		cookieStrings.push('youtube_authaccount=' + decodeURI(cookies.authAccount) + ';path=/');
	}
	if (cookies.refreshToken) {
		cookieStrings.push('youtube_refreshtoken=' + decodeURI(cookies.refreshToken) + ';path=/');
	}

	this.getCommunity().setCookies(cookieStrings);
}
