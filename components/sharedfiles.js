const SteamBadgeUnlocker = require('../index');

const SteamCommunityHelpers = require('steamcommunity/components/helpers');
const {getActionUrl} = require('./helpers');


/**
 * @param {string} fileId
 * @param {string|number} appId
 * @returns {Promise<true>}
 */
SteamBadgeUnlocker.prototype.subscribeToSharedFile = function (fileId, appId) {
	return new Promise((resolve, reject) => {
		return this.post({
			url: 'https://steamcommunity.com/sharedfiles/subscribe',
			qs: {
				l: this.getLanguage(),
			},
			json: true,
			form: {
				'id': fileId,
				'appid': appId,
				'sessionid': this.getSessionId(),
			},
			headers: {
				'Origin': 'https://steamcommunity.com',
				'Accept': '*/*',
				'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
				'Referer': 'https://steamcommunity.com/sharedfiles/filedetails/?id=' + fileId,
			}
		}).then((body) => {
			const error = SteamCommunityHelpers.eresultError(body.success);
			if (error === null) {
				resolve(true);
				return;
			}
			reject(error);
		}).catch((e) => reject(e));
	});
}

/**
 * @param {string} fileId
 * @param {string|number} appId
 * @returns {Promise<true>}
 */
SteamBadgeUnlocker.prototype.unsubscribeFromSharedFile = function (fileId, appId) {
	return new Promise((resolve, reject) => {
		this.post({
			url: 'https://steamcommunity.com/sharedfiles/unsubscribe',
			qs: {
				l: this.getLanguage(),
			},
			json: true,
			form: {
				'id': fileId,
				'appid': appId,
				'sessionid': this.getSessionId(),
			},
			headers: {
				'Origin': 'https://steamcommunity.com',
				'Accept': '*/*',
				'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
				'Referer': 'https://steamcommunity.com/sharedfiles/filedetails/?id=' + fileId,
			}
		}).then((body) => {
			const error = SteamCommunityHelpers.eresultError(body.success);
			if (error === null) {
				resolve(true);
				return;
			}
			reject(error);
		}).catch((e) => reject(e));
	});
}

/**
 * @param {string} fileId
 * @param {{qs: {insideModal: 1|0}, headers: module:http.IncomingHttpHeaders}} params
 * @returns {Promise<string>}
 */
SteamBadgeUnlocker.prototype.getSharedFileDetails = function (fileId, params = {}) {
	return this.get({
		url: 'https://steamcommunity.com/sharedfiles/filedetails/',
		qs: {
			l: this.getLanguage(),
			id: fileId,
			...(params.qs || {}),
		},
		headers: {
			'Origin': 'https://steamcommunity.com',
			'Accept': '*/*',
			'Referer': 'https://steamcommunity.com/sharedfiles/filedetails/?id=' + fileId,
			...(params.headers || {}),
		}
	});
}

/**
 * @link https://community.akamai.steamstatic.com/public/javascript/sharedfiles_functions_logged_in.js
 * @param {string} fileId
 * @param {boolean} up
 * @returns {Promise<true>}
 */
SteamBadgeUnlocker.prototype.voteSharedFile = function (fileId, up = true) {
	return new Promise((resolve, reject) => {
		return this.post({
			url: 'https://steamcommunity.com/sharedfiles/vote' + (up ? 'up' : 'down'),
			qs: {
				l: this.getLanguage(),
			},
			json: true,
			form: {
				id: fileId,
				sessionid: this.getSessionId(),
			},
			headers: {
				'Origin': 'https://steamcommunity.com',
				'Accept': '*/*',
				'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
				'Referer': 'https://steamcommunity.com/sharedfiles/filedetails/?id=' + fileId,
			}
		}).then((body) => {
			const error = SteamCommunityHelpers.eresultError(body.success);
			if (error === null) {
				resolve(true);
				return;
			}
			reject(error);
		}).catch((e) => reject(e));
	});
}

/**
 * @param {string} fileId
 * @param {number} appId
 * @param {EFileTypeType} fileType
 * @returns {Promise<true>}
 */
SteamBadgeUnlocker.prototype.deleteSharedFile = function (fileId, appId = 0, fileType = 'videos') {
	return new Promise((resolve, reject) => {
		return this.post({
			url: 'https://steamcommunity.com/sharedfiles/delete',
			qs: {
				l: this.getLanguage(),
			},
			followAllRedirects: true,
			followOriginalHttpMethod: true,
			form: {
				id: fileId,
				appid: appId,
				sessionid: this.getSessionId(),
				file_type: SteamBadgeUnlocker.EFileType[fileType],
			},
			headers: {
				'Origin': 'https://steamcommunity.com',
				'Accept': '*/*',
				'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
				'Referer': 'https://steamcommunity.com/sharedfiles/filedetails/?id=' + fileId,
			}
		}).then((body) => {
			if (/profile_fatalerror_message/.test(body)) {
				reject(new Error('profile_fatalerror_message'));
				return;
			}
			resolve(true);
		}, (e) => reject(e));
	});
}

/**
 * @param {string} steamId
 * @param {string} fileId
 * @param {string} comment
 * @param {number} count
 * @returns {Promise<string>}
 */
SteamBadgeUnlocker.prototype.postSharedFileComment = function (steamId, fileId, comment, count = 5) {

	return new Promise((resolve, reject) => {
		this.post({
			url: getActionUrl({
				type: 'PublishedFile_Public',
				action: 'post',
				owner: steamId,
				feature: fileId,
			}),
			form: {
				comment,
				count,
				sessionid: this.getSessionId(),
				feature2: -1,
			},
			'json': true,
			headers: {
				'Origin': 'https://steamcommunity.com',
				'Accept': '*/*',
				'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
				'Referer': 'https://steamcommunity.com/sharedfiles/filedetails/?id=' + fileId + '&insideModal=1',
			},
		}).then((response) => {
			if (response && response.success) {
				const commentAttrId = response.comments_html.match(/id="comment_(\d+)"/);
				if (commentAttrId) {
					resolve(commentAttrId[1]);
					return;
				}
				reject(new Error('ERR_ON_SUCCESS_ID_NOT_FOUND'));
				return;
			}
			if (response && response.error) {
				reject(new Error(response.error));
				return;
			}
			reject(new Error('Unknown error'));
		}, (e) => reject(e));
	});
}

/**
 * @param {string} steamId
 * @param {string} fileId
 * @param {string} commentId
 * @param {number} count
 * @returns {Promise<true>}
 */
SteamBadgeUnlocker.prototype.deleteSharedFileComment = function (steamId, fileId, commentId, count = 5) {

	return new Promise((resolve, reject) => {
		this.post({
			url: getActionUrl({
				type: 'PublishedFile_Public',
				action: 'delete',
				owner: steamId,
				feature: fileId,
			}),
			form: {
				gidcomment: commentId,
				start: 0,
				count,
				sessionid: this.getSessionId(),
				feature2: -1,
			},
			'json': true,
			headers: {
				'Origin': 'https://steamcommunity.com',
				'Accept': '*/*',
				'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
				'Referer': 'https://steamcommunity.com/sharedfiles/filedetails/?id=' + fileId + '&insideModal=1',
			},
		}).then((response) => {

			if (response.success && !response.comments_html.includes(commentId)) {
				resolve(true);
			} else if (response.error) {
				reject(new Error(response.error));
			} else if (body.comments_html.includes(commentId)) {
				reject(new Error('Failed to delete comment'));
			} else {
				reject(new Error('Unknown error'));
			}
		}, (e) => reject(e));
	});
}
