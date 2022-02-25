const SteamBadgeUnlocker = require('../index');

/**
 * @param {{qs?: AllContentHomeQuery, headers?: module:http.IncomingHttpHeaders}} params
 * @returns {Promise<Array<WorkshopLink>>}
 */
SteamBadgeUnlocker.prototype.getWorkshopTrendLinks = function (params = {}) {
	const self = this;
	return new Promise((resolve, reject) => {
		self.getAllContentHome('workshop', params).then((body) => {
			/** @type {Array<WorkshopLink>} */
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

			resolve(links);
		}, (e) => reject(e));
	});
}

/**
 * @param {number} appId
 * @param {EFileTypeType} type
 * @returns {Promise<{url: string, params: {title: string, description: string}}>}
 * @private
 */
SteamBadgeUnlocker.prototype._getUgcUploadForm = function (appId = 767, type = 'images') {
	const fileType = SteamBadgeUnlocker.EFileType[type];
	return new Promise((resolve, reject) => {
		this.get({
			url: `https://steamcommunity.com/sharedfiles/edititem/767/3/`,
			qs: {
				l: this.getLanguage(),
			},
			headers: {},
		}).then(html => {
			const token = html.match(/name="token" value="([^"]+)"/);
			if (!token) {
				reject(new Error('ERR_MISSING_TOKEN_FIELD'));
				return;
			}

			const wg = html.match(/name="wg" value="([^"]+)"/);
			const wgHmac = html.match(/name="wg_hmac" value="([^"]+)"/);
			if (!wg || !wgHmac) {
				reject(new Error('ERR_MISSING_WG_FIELD'));
				return;
			}

			const url = html.match(/ action="([^"]+steamcontent[^"]+upload)"/);
			if (!url) {
				reject(new Error('ERR_MISSING_FORM_ACTION'));
				return;
			}

			const form = {
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
					visibility: 2, // 0=Public, 1=Friends, 2=Private, 3=Unlisted
					agree_terms: 'on',
					title: '',
					description: '',
				},
			};
			resolve(form);
		}, (e) => reject(e));
	});
}

/**
 * @param {number} appId
 * @param {string} title
 * @param {string} description
 * @param {fs.ReadStream} file
 * @returns {Promise<{success: true, id: string}>}
 */
SteamBadgeUnlocker.prototype.uploadScreenshot = function (appId, title, description, file) {
	return new Promise((resolve, reject) => {
		const _badgeUnlocker = this;
		this._getUgcUploadForm(appId, 'screenshots').then(form => {
			const formData = {
				...form.params,
				title,
				description,
				file: [file],
			};

			_badgeUnlocker.post({
				url: form.url,
				formData,
				followAllRedirects: true,
				headers: {
					'Origin': 'https://steamcommunity.com',
					'Accept': '*/*',
					'Referer': `https://steamcommunity.com/`,
				},
			}).then(body => {
				const pattern = /id=(\d+)&fileuploadsuccess=1/;
				if (pattern.test(body)) {
					resolve({
						success: true,
						id: body.match(pattern)[1],
					});
					return;
				}
				reject(new Error('ERR_SCREENSHOT_UPLOAD_FAILED'));
			}, (e) => reject(e));
		}, (e) => reject(e));
	});
}

/** @typedef {{url: string, fileId: string, appId: number}} WorkshopLink */
