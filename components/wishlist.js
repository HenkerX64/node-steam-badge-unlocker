const SteamBadgeUnlocker = require('../index');


/**
 * @link https://store.cloudflare.steamstatic.com/public/javascript/main.js
 * @param {string} snr
 * @param {string} url
 */
SteamBadgeUnlocker.prototype.makeNavCookie = function (snr, url) {
    const dateExpires = new Date();
    dateExpires.setTime(dateExpires.getTime() + 1000 * 60);
    this.getCommunity().setCookies([
        'snr=' + snr + '|' + encodeURIComponent(url) + '; expires=' + dateExpires.toUTCString() + ';path=/',
    ]);
}

/**
 * @link https://store.cloudflare.steamstatic.com/public/javascript/dynamicstore.js
 * @param {string} navRef
 * @param {number} appId
 * @param {boolean} remove
 * @returns {Promise<{success: boolean, wishlistCount: number}>}
 */
SteamBadgeUnlocker.prototype.modifyWishlist = function (navRef, appId, remove) {
    const url = 'https://store.steampowered.com/api/' + (remove ? 'removefromwishlist' : 'addtowishlist');
    this.makeNavCookie(navRef, url);

    return this.post({
        url,
        followAllRedirects: true,
        followOriginalHttpMethod: true,
        json: true,
        form: {
            appid: appId,
            sessionid: this.getSessionId(),
            snr: navRef,
        },
        headers: {
            'Origin': 'https://store.steampowered.com',
            'Accept': '*/*',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Referer': 'https://store.steampowered.com/app/' + appId
        }
    });
}

/**
 * @link https://store.cloudflare.steamstatic.com/public/javascript/main.js
 * @param {number} appId
 * @param {string} navRef
 * @returns {Promise<{success: boolean, wishlistCount: number}>}
 */
SteamBadgeUnlocker.prototype.addToWishlist = function (appId, navRef = '1_direct-navigation__') {
    return this.modifyWishlist(navRef, appId, false);
}

/**
 * @link https://store.cloudflare.steamstatic.com/public/javascript/main.js
 * @param {number} appId
 * @param {string} navRef
 * @returns {Promise<{success?: boolean, wishlistCount: number}>}
 */
SteamBadgeUnlocker.prototype.removeFromWishlist = function (appId, navRef = '1_direct-navigation__') {
    return this.modifyWishlist(navRef, appId, true);
}


