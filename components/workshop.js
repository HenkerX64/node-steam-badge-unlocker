const SteamBadgeUnlocker = require('../index');
const EErrorCode = require('../resources/EErrorCode');
const {createError} = require('./helpers');

/** @type {import('../index')['getWorkshopTrendLinks']} */
SteamBadgeUnlocker.prototype.getWorkshopTrendLinks = async function (params = {}) {
	const body = await this.getAllContentHome('workshop', params);
	/** @type {Array<import('../index').WorkshopLink>} */
	const links = [];
	const pattern = /data-appid="(\d+)"\s+data-publishedfileid="(\d+)"/;
	const matches = body.match(new RegExp(pattern, 'g'));
	if (matches) {
		for (let string of matches) {
			const [, appId, fileId] = string.match(pattern);
			links.push({
				url: 'https://steamcommunity.com/sharedfiles/filedetails/?id=' + fileId,
				fileId,
				appId: Number(appId),
			});
		}
	}

	return links;
}

/** @type {import('../index')['_getUgcUploadForm']} */
SteamBadgeUnlocker.prototype._getUgcUploadForm = async function (appId = 767, type = 'images') {
	const fileType = SteamBadgeUnlocker.EFileType[type];
	const html = await this.get({
		url: `https://steamcommunity.com/sharedfiles/edititem/767/3/`,
		qs: {
			l: this.getLanguage(),
		},
		headers: {},
	});
	const token = html.match(/name="token" value="([^"]+)"/);
	if (!token) {
		throw createError(EErrorCode.MISSING_TOKEN_FIELD);
	}

	const wg = html.match(/name="wg" value="([^"]+)"/);
	const wgHmac = html.match(/name="wg_hmac" value="([^"]+)"/);
	if (!wg || !wgHmac) {
		throw createError(EErrorCode.MISSING_WG_FIELD);
	}

	const url = html.match(/ action="([^"]+(steamcontent|steamserver)[^"]+upload[^"]*)"/);
	if (!url) {
		throw createError(EErrorCode.MISSING_FORM_ACTION);
	}

	return {
		url: url[1],
		params: {
			redirect_uri: 'https://steamcommunity.com/sharedfiles/filedetails/',
			wg: wg[1],
			wg_hmac: wgHmac[1],
			realm: 1,
			appid: 767,
			consumer_app_id: appId,
			sessionid: this.getSessionId(),
			token: token[1],
			cloudfilenameprefix: '',
			publishedfileid: 0,
			id: 0,
			file_type: fileType,
			image_width: 0,
			image_height: 0,
			visibility: SteamBadgeUnlocker.EPublishedFileVisibility.Private,
			agree_terms: 'on',
			title: '',
			description: '',
		},
	};
}

/**
 * @param {import('../index').ReadableLike|null} file
 * @returns {Promise<never>}
 */
function firstStreamError(file) {
	return new Promise((resolve, reject) => {
		if (file && typeof file.once === 'function') {
			file.once('error', reject);
		}
	});
}

/**
 * @param {import('../index').ReadableLike|null} file
 */
function closeFile(file) {
	if (file && typeof file.destroy === 'function') {
		file.destroy();
	}
}

/** @type {import('../index')['uploadScreenshot']} */
SteamBadgeUnlocker.prototype.uploadScreenshot = async function (appId, title, description, file, visibility = SteamBadgeUnlocker.EPublishedFileVisibility.Private) {
	const fileError = firstStreamError(file);
	try {
		const form = await Promise.race([this._getUgcUploadForm(appId, 'screenshots'), fileError]);
		const body = await Promise.race([this.post({
			url: form.url,
			formData: {
				...form.params,
				title,
				description,
				visibility,
				file: [file],
			},
			followAllRedirects: true,
			headers: {
				'Origin': 'https://steamcommunity.com',
				'Accept': '*/*',
				'Referer': `https://steamcommunity.com/`,
			},
		}), fileError]);
		const pattern = /id=(\d+)&fileuploadsuccess=1/;
		if (!pattern.test(body)) {
			throw createError(EErrorCode.SCREENSHOT_UPLOAD_FAILED);
		}
		return {
			success: true,
			id: body.match(pattern)[1],
		};
	} catch (error) {
		closeFile(file);
		throw error;
	}
}
