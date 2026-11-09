const SteamBadgeUnlocker = require('../index');

const {eresultError} = require('./steamcommunity-helpers');
const {getActionUrl, createError} = require('./helpers');
const EErrorCode = require('../resources/EErrorCode');


/** @type {import('../index')['subscribeToSharedFile']} */
SteamBadgeUnlocker.prototype.subscribeToSharedFile = async function (fileId, appId) {
	const body = await this.post({
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
	});
	const error = eresultError(body.success);
	if (error !== null) {
		throw error;
	}
	return true;
}

/** @type {import('../index')['unsubscribeFromSharedFile']} */
SteamBadgeUnlocker.prototype.unsubscribeFromSharedFile = async function (fileId, appId) {
	const body = await this.post({
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
	});
	const error = eresultError(body.success);
	if (error !== null) {
		throw error;
	}
	return true;
}

/** @type {import('../index')['getSharedFileDetails']} */
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
 * @type {import('../index')['voteSharedFile']}
 */
SteamBadgeUnlocker.prototype.voteSharedFile = async function (fileId, up = true) {
	const body = await this.post({
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
	});
	const error = eresultError(body.success);
	if (error !== null) {
		throw error;
	}
	return true;
}

/** @type {import('../index')['deleteSharedFile']} */
SteamBadgeUnlocker.prototype.deleteSharedFile = async function (fileId, appId = 0, fileType = 'videos') {
	const body = await this.post({
		url: 'https://steamcommunity.com/sharedfiles/delete',
		qs: {
			l: this.getLanguage(),
		},
		followAllRedirects: true,
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
	});
	if (/profile_fatalerror_message/.test(body)) {
		throw createError(EErrorCode.REJECTED_SHARED_FILE_DELETE);
	}
	return true;
}

/** @type {import('../index')['postSharedFileComment']} */
SteamBadgeUnlocker.prototype.postSharedFileComment = async function (steamId, fileId, comment, count = 5) {
	if (!steamId) {
		throw createError(EErrorCode.MISSING_FILE_OWNER_STEAM_ID);
	}
	if (!fileId) {
		throw createError(EErrorCode.MISSING_FILE_ID);
	}
	const response = await this.post({
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
	});
	if (response && response.success) {
		const commentAttrId = (response.comments_html || '').match(/id="comment_(\d+)"/);
		if (commentAttrId) {
			return commentAttrId[1];
		}
		throw createError(EErrorCode.ON_SUCCESS_ID_NOT_FOUND);
	}
	if (response && response.error) {
		throw createError(EErrorCode.REJECTED_COMMENT_POST, response.error);
	}
	throw createError(EErrorCode.UNKNOWN_COMMENT_POST);
}

/** @type {import('../index')['deleteSharedFileComment']} */
SteamBadgeUnlocker.prototype.deleteSharedFileComment = async function (steamId, fileId, commentId, count = 5) {
	const response = await this.post({
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
	});
	const commentsHtml = response.comments_html || '';
	if (response.success && !commentsHtml.includes(commentId)) {
		return true;
	}
	if (response.error) {
		throw createError(EErrorCode.REJECTED_COMMENT_DELETE, response.error);
	}
	if (commentsHtml.includes(commentId)) {
		throw createError(EErrorCode.REJECTED_COMMENT_DELETE);
	}
	throw createError(EErrorCode.UNKNOWN_COMMENT_DELETE);
}
