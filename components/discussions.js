const SteamBadgeUnlocker = require('../index');

/**
 * @param {string} query
 * @returns {Promise<string>}
 */
SteamBadgeUnlocker.prototype.discussionsSearch = function (query) {
	return this.get({
		url: 'https://steamcommunity.com/discussions/forum/search/',
		qs: {
			l: this.getLanguage(),
			q: query,
		},
		headers: {
			'Origin': 'https://steamcommunity.com',
			'Accept': '*/*',
			'Referer': 'https://steamcommunity.com/discussions/'
		},
	});
}
