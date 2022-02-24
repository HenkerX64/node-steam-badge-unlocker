const SteamBadgeUnlocker = require('../index');

/**
 * @param {{qs?: AllContentHomeQuery, headers?: module:http.IncomingHttpHeaders}} params
 * @returns {Promise<Array<GuideLink>>}
 */
SteamBadgeUnlocker.prototype.getGuidesTrendLinks = function (params = {}) {
    const self = this;
    return new Promise((resolve, reject) => {
        self.getAllContentHome('guides', params).then((body) => {
            /** @type {Array<GuideLink>} */
            const links = [];
            const pattern = /https?:\/\/(www\.)?steamcommunity\.com\/sharedfiles\/filedetails\/\?id=([0-9]+)/;
            const matches = body.match(new RegExp(pattern, 'g'));
            if (matches) {
                for (let link of matches) {
                    const match = link.match(pattern);
                    links.push({
                        url: match[0],
                        guideId: match[2],
                    });
                }
            }

            resolve(links);
        }, (e) => reject(e));
    });
}

/** @typedef {{url: string, guideId: string}} GuideLink */
