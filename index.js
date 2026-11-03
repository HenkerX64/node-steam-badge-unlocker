module.exports = SteamBadgeUnlocker;
module.exports.default = SteamBadgeUnlocker;
SteamBadgeUnlocker.ECommunityBadgeQuests = require('./resources/ECommunityBadgeQuests');
SteamBadgeUnlocker.EFileType = require('./resources/EFileType');
SteamBadgeUnlocker.EPublishedFileVisibility = require('./resources/EPublishedFileVisibility');
SteamBadgeUnlocker.ESubSection = require('./resources/ESubSection');
SteamBadgeUnlocker.EErrorCode = require('./resources/EErrorCode');
const {createError} = require('./components/helpers');

/**
 * @param {SteamCommunity} SteamCommunity
 * @param {{apiKey?: string, apiToken?: string, customUrl?: string}} options
 * @constructor
 * @returns {SteamBadgeUnlocker}
 */
function SteamBadgeUnlocker(SteamCommunity, options = {}) {
	// !SteamCommunity instanceof community
	if (!SteamCommunity || typeof SteamCommunity !== 'object' || typeof SteamCommunity.getSessionID !== 'function') {
		throw createError(SteamBadgeUnlocker.EErrorCode.MISSING_COMMUNITY);
	}

	options = options || {};

	this._community = SteamCommunity;
	this._steamId = (SteamCommunity.steamID || '').toString();
	this._sessionId = SteamCommunity.getSessionID();
	this._apiKey = options.apiKey || null;
	this._apiToken = options.apiToken || null;
	this._profileUrl = `https://steamcommunity.com/profiles/${this._steamId}`;

	/** @returns {string} */
	this.getLanguage = () => 'english';
	/** @returns {string} */
	this.getSteamId = () => this._steamId;
	/** @returns {string} */
	this.getProfileUrl = () => this._profileUrl;
	this.setCustomProfileUrl = (customUrl) => this._profileUrl = `https://steamcommunity.com/id/${customUrl}`;
	if (options.customUrl) {
		this.setCustomProfileUrl(options.customUrl);
	}
	/** @returns {string} */
	this.getSessionId = () => this._sessionId;
	/** @returns {SteamCommunity} */
	this.getCommunity = () => this._community;

	/**
	 * @param {SteamBadgeUnlockerParams} params
	 * @returns {Promise<string | Object>}
	 */
	const createPromiseRequest = function (params) {
		return new Promise((resolve, reject) => {
			/**
			 * @param {null|Error} err
			 * @param {module:http.IncomingMessage} response
			 * @param {string|Object} body
			 */
			const callback = (err, response, body) => {
				if (err) {
					reject(err);
					return;
				}
				resolve(body);
			};

			SteamCommunity.httpRequest(params, callback, 'SteamBadgeUnlocker');
		});
	}

	/**
	 * @param {SteamBadgeUnlockerParams} params
	 * @returns {Promise<string | Object>}
	 */
	this.get = function (params) {
		params = params || {};
		params.method = 'get';
		return createPromiseRequest(params);
	}

	/**
	 * @param {SteamBadgeUnlockerParams} params
	 * @returns {Promise<string | Object>}
	 */
	this.post = function (params) {
		params = params || {};
		params.method = 'post';
		return createPromiseRequest(params);
	}

	/**
	 * Fetch api key only one time.
	 * @returns {Promise<string>}
	 */
	this.getWebApiKey = async function () {
		if (this._apiKey !== null) {
			return this._apiKey;
		}
		this._apiKey = '';
		this._apiKey = await new Promise((resolve, reject) => {
			this._community.getWebApiKey('localhost', (error, apiKey) => error ? reject(error) : resolve(apiKey));
		});
		return this._apiKey;
	}

	/**
	 * Fetch api token only one time.
	 * @returns {Promise<string>}
	 */
	this.getWebApiToken = async function () {
		if (this._apiToken !== null) {
			return this._apiToken;
		}
		this._apiToken = '';
		// fetch api token from store
		const html = await this.get({
			url: 'https://store.steampowered.com/points/shop',
			qs: {
				l: this.getLanguage(),
			},
			headers: {
				'Origin': 'https://store.steampowered.com',
				'Accept': '*/*',
				'Referer': `${this.getProfileUrl()}/edit/info`,
			}
		}).catch(() => null);
		if (html) {
			const tokenMatches = html.match(/webapi_token&quot;:&quot;([^"&]+)/);
			if (tokenMatches && tokenMatches.length > 1) {
				this._apiToken = tokenMatches[1];
				return this._apiToken;
			}
		}
		throw createError(SteamBadgeUnlocker.EErrorCode.NOT_FOUND_WEBAPI_TOKEN);
	}
}


require('./components/apps');
require('./components/badges');
require('./components/broadcast');
require('./components/discussions');
require('./components/guides');
require('./components/profile');
require('./components/sharedfiles');
require('./components/videos');
require('./components/wishlist');
require('./components/workshop');
require('./classes/CCommunityLeader');


/** @typedef {module:http.IncomingMessage} ResponseMessage */
/** @typedef {{
 * uri: string|UrlObject,
 * url?: string|UrlObject,
 * baseUrl?: string,
 * json?: boolean|false,
 * headers?: Object.<string, string>,
 * multipart?: object|Array,
 * form?: object,
 * formData?: object,
 * method?: string,
 * body?: string,
 * jar?: boolean,
 * preambleCRLF?: boolean,
 * postambleCRLF?: boolean,
 * qs?: object,
 * oauth?: object,
 * agentOptions?: object,
 * har?: object,
 * time?: boolean,
 * timeout?: number,
 * followRedirect?: boolean|true,
 * followAllRedirects?: boolean|false,
 * followOriginalHttpMethod?: boolean|false,
 * maxRedirects?: number|10,
 * removeRefererHeader?: boolean|false,
 * }} SteamBadgeUnlockerParams */
