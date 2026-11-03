/**
 * @param {number} seconds
 * @returns {Promise<undefined>}
 */
exports.delay = seconds => {
	return new Promise((resolve) => setTimeout(resolve, 1000 * seconds));
}

/** @typedef {keyof typeof import('../resources/EErrorCode')} ErrorCode */

/**
 * @template {ErrorCode} T
 * @param {T} code
 * @param {string} [message]
 * @returns {Error & {code: T}}
 */
exports.createError = (code, message = code) => Object.assign(new Error(message), {code});

const previousOfFinishedHook = new WeakMap();

/**
 * @param {Function} [hook]
 * @returns {Function|undefined}
 */
function skipFinishedHooks(hook) {
	while (previousOfFinishedHook.has(hook)) {
		hook = previousOfFinishedHook.get(hook);
	}
	return hook;
}

/**
 * @template T
 * @param {SteamCommunity} community
 * @param {function(Object): void} editOptions
 * @param {function(): Promise<T>} run
 * @returns {Promise<T>}
 */
exports.withRequestOptions = async (community, editOptions, run) => {
	const previous = community.onPreHttpRequest;
	let editing = true;
	const hook = function (requestId, source, options, continueRequest) {
		if (editing) {
			editOptions(options);
		}
		return previous ? previous.call(this, requestId, source, options, continueRequest) : false;
	};
	community.onPreHttpRequest = hook;
	try {
		return await run();
	} finally {
		editing = false;
		previousOfFinishedHook.set(hook, previous);
		if (community.onPreHttpRequest === hook) {
			const restored = skipFinishedHooks(previous);
			if (restored) {
				community.onPreHttpRequest = restored;
			} else {
				delete community.onPreHttpRequest;
			}
		}
	}
};

const MISSING_REQUIRED_HEADERS = {'Accept-Language': 'en-US,en;q=0.9'};

/**
 * @template T
 * @param {SteamCommunity} community
 * @param {function(): Promise<T>} run
 * @returns {Promise<T>}
 */
exports.withMissingRequiredHeaders = (community, run) => exports.withRequestOptions(community, (options) => {
	const headerNames = Object.keys(options.headers || {}).map(name => name.toLowerCase());
	options.headers = Object.assign({}, options.headers);
	Object.keys(MISSING_REQUIRED_HEADERS)
		.filter(name => !headerNames.includes(name.toLowerCase()))
		.forEach(name => options.headers[name] = MISSING_REQUIRED_HEADERS[name]);
}, run);

/**
 * @link https://community.cloudflare.steamstatic.com/public/javascript/global.js
 * @param {CommentActionParams} params
 * @returns {string}
 */
exports.getActionUrl = params => {
	return `https://steamcommunity.com/comment/${params.type}/${params.action}/${params.owner}/${params.feature}/`;
}
/** @typedef {'ClanAnnouncement'|'ForumTopic'|'PublishedFile_Public'|'Recommendation'|'UserReceivedNewGame'|'UserStatusPublished'} CommentType */
/** @typedef {'upvote'|'downvote'|'delete'|'post'|'render'|'hideandreport'} CommentActionType */
/** @typedef {{type: CommentType, action?: CommentActionType, owner: string, feature: string, feature2?: string}} CommentActionParams */


/**
 * Steam id should have 17 numbers to be valid.
 * @param {string} value
 * @returns {boolean}
 */
function isSteamId(value) {
	return /^\d{17}$/.test(value);
}

exports.isSteamId = isSteamId;

/**
 * Please enter an account name that is at least 3 characters long and uses only a-z, A-Z, 0-9 or _ characters.
 * @param {string} value
 * @returns {boolean}
 */
function isAccountName(value) {
	return /^[\w\d_]{3,64}$/i.test(value);
}

/**
 * Please enter a password that is less than 64 characters long, with at least 8 characters.
 * @param {string} value
 * @returns {boolean}
 */
function isAllowedPassword(value) {
	return (value.length >= 7 && value.length <= 64);
}

/**
 * Shared secret should be base64 string and 27 characters long.
 * @param {string} value
 * @returns {boolean}
 */
function isSharedSecret(value) {
	return /^[\w\d+-=\/]{20,64}$/i.test(value);
}

/**
 * Parse config file.
 *
 * Format example:
 * ```
 *      username1;password;sharedKey;steamId
 *      username2;password;sharedKey;
 * ```
 *
 * @param {string} config
 * @param {string} delimiter
 * @returns {Array<{accountName: string, password: string, secret: string, params?: Array<string>}>}
 */
function parseConfigString(config, delimiter = ';') {
	if (typeof config !== 'string' || typeof delimiter !== 'string') {
		return [];
	}
	const rows = config.split("\n");
	const result = [];
	for (const row of rows) {
		const cols = row.replace(/\s+/g, '').split(delimiter);
		if (cols.length < 3) {
			continue;
		}
		const [accountName, password, secret] = cols;
		if (!isAccountName(accountName) || !isAllowedPassword(password)) {
			continue;
		}
		if (secret !== '' && !isSharedSecret(secret)) {
			continue;
		}
		result.push({accountName, password, secret, params: cols.slice(3)});
	}

	return result;
}

exports.parseConfigString = parseConfigString;
