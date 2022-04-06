/**
 * @param {number} seconds
 * @returns {Promise<undefined>}
 */
exports.delay = seconds => {
	return new Promise((resolve) => setTimeout(resolve, 1000 * seconds));
}

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
