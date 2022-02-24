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


/** @typedef {{url: string, fileId: string, appId: number}} WorkshopLink */
