const SteamBadgeUnlocker = require('../index');


/** @typedef {{fileId: string, youtubeId: string}} ProfileVideos */
/**
 * Get already shared videos from current steam profile.
 *
 * @param {{qs: Object}} params
 * @returns {Promise<Array<ProfileVideos>>}
 */
SteamBadgeUnlocker.prototype.getProfileVideos = function (params = {}) {
    return new Promise((resolve, reject) => {
        this.get({
            url: `${this.getProfileUrl()}/videos/`,
            qs: {
                l: 'english',
                appid: 0,
                sort: 'newestfirst',
                browsefilter: 'myfiles',
                privacy: 30,
                ...(params.qs || {}),
            },
            followAllRedirects: true,
            headers: {
                'Origin': 'https://steamcommunity.com',
                'Accept': '*/*',
                'Referer': `${this.getProfileUrl()}/videos/`,
            }
        }).then(html => {
            const result = [];
            const pattern = /"video_item"(.|\n)*?<a.*?filedetails\/\?id=([0-9]+)"(.|\n)*?src="[^"]+\/vi\/([^/]+)\/(.|\n)*?<\/a>/;
            const videoItemsMatches = html.match(new RegExp(pattern, 'g'));
            if (videoItemsMatches && videoItemsMatches.length > 0) {
                for (let item of videoItemsMatches) {
                    const linkSplit = item.match(pattern);
                    result.push({
                        fileId: linkSplit[2],
                        youtubeId: linkSplit[4],
                    })
                }
            }
            resolve(result);

        }, (e) => reject(e));
    });
}

/**
 * Fetch most recent available YouTube videos to share.
 *
 * @note You need to assign YouTube accessToken cookie before using this.
 * @see SteamBadgeUnlocker.setYoutubeCookies
 * @returns {Promise<Array<{youtubeId: string}>>}
 */
SteamBadgeUnlocker.prototype.fetchYoutubeVideos = function () {
    return new Promise((resolve, reject) => {
        this.get({
            url: `${this.getProfileUrl()}/videos/add/`,
            qs: {
                l: 'english',
                ls: 1,
            },
            followAllRedirects: true,
            headers: {
                'Origin': 'https://steamcommunity.com',
                'Accept': '*/*',
                'Referer': `${this.getProfileUrl()}/videos/`,
            }
        }).then(html => {
            const result = [];
            const pattern = /name="videos\[]"\s+value="([^"]+)"/;
            const checkboxMatches = html.match(new RegExp(pattern, 'g'));
            if (checkboxMatches && checkboxMatches.length > 0) {
                for (let checkbox of checkboxMatches) {
                    result.push({youtubeId: checkbox.match(pattern)[1]});
                }
            }
            resolve(result);

        }, (e) => reject(e));
    });
}

/**
 * Add public YouTube videos to steam profile.
 *
 * @note You need to assign YouTube accessToken cookie before using this.
 * @see SteamBadgeUnlocker.setYoutubeCookies
 * @param {Array<string>|string} youtubeIds
 * @param {number} appId
 * @param {string} otherAssoc
 * @returns {Promise<number>}
 */
SteamBadgeUnlocker.prototype.postYoutubeVideo = function (youtubeIds, appId = 0, otherAssoc = '') {
    return new Promise((resolve, reject) => {
       this.post({
           url: `${this.getProfileUrl()}/videos/add/`,
           qs: {
               l: 'english',
           },
           followAllRedirects: true,
           followOriginalHttpMethod: true,
           form: {
               action: 'add',
               sessionid: this.getSessionId(),
               videos: typeof youtubeIds === 'string' ? [youtubeIds] : youtubeIds,
               app_assoc: appId,
               other_assoc: otherAssoc,
           },
           headers: {
               'Origin': 'https://steamcommunity.com',
               'Accept': '*/*',
               'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
               'Referer': `${this.getProfileUrl()}/videos/add/?ls=1`,
           }
       }).then(html => {
           const addedMatches = html.match(/Successfully added (\d+) video/);
           if (addedMatches && addedMatches.length > 0) {
               resolve(Number(addedMatches[1]));
               return;
           }

           resolve(0);

       }, (e) => reject(e));
    });
}

/** @typedef {{accessToken: string, authAccount?: string, refreshToken?: string}} YoutubeCookies */
/**
 * @param {YoutubeCookies} cookies
 * @see https://steamcommunity.com/my/videos/link
 */
SteamBadgeUnlocker.prototype.setYoutubeCookies = function (cookies) {
    if (!cookies || !cookies.accessToken || !cookies.authAccount || !cookies.refreshToken) {
        throw new Error('Invalid youtube cookies parameter! Required: accessToken');
    }
    const cookieStrings = [
        'youtube_accesstoken=' + decodeURI(cookies.accessToken) + ';path=/',
    ];
    if (cookies.authAccount) {
        cookieStrings.push('youtube_authaccount=' + decodeURI(cookies.authAccount) + ';path=/');
    }
    if (cookies.refreshToken) {
        cookieStrings.push('youtube_refreshtoken=' + decodeURI(cookies.refreshToken) + ';path=/');
    }

    this._community.setCookies(cookieStrings);
}
