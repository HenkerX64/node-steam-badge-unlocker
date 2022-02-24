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

/**
 * @link https://community.cloudflare.steamstatic.com/public/javascript/discussions.js
 * @param {string} query
 * @param {DiscussionsGamesListType} listType
 * @returns {Promise<string>}
 * @deprecated Out of scope: Not needed to solve the task
 */
SteamBadgeUnlocker.prototype.discussionsGameForumSearch = function (query, listType = 'searchallapps') {
    return this.get({
        url: 'https://steamcommunity.com/discussions/games/',
        qs: {
            l: this.getLanguage(),
            searchquery: query,
            results: 1,
            type: listType,
        },
        headers: {
            'Origin': 'https://steamcommunity.com',
            'Accept': '*/*',
            'Referer': 'https://steamcommunity.com/discussions/'
        },
    });
}

/** @typedef {'searchallapps'|'popular'|'recent'|'allowned'|'wishlist'|'recommended'|'visited'} DiscussionsGamesListType */
