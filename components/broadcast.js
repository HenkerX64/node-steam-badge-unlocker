const SteamBadgeUnlocker = require('../index');

/**
 * @link https://community.cloudflare.steamstatic.com/public/javascript/broadcast_watch.js
 * @param {string} steamId
 * @returns {Promise<BroadcastMpd>}
 */
SteamBadgeUnlocker.prototype.getBroadcastManifest = function (steamId) {
    return this.get({
        url: 'https://steamcommunity.com/broadcast/getbroadcastmpd/',
        qs: {
            l: this.getLanguage(),
            steamid: steamId,
            sessionid: this.getSessionId(),
            broadcastid: 0,
            viewertoken: 0,
            watchlocation: 5,
        },
        json: true,
        headers: {
            'Origin': 'https://steamcommunity.com',
            'Referer': 'https://steamcommunity.com/broadcast/watch/' + steamId
        },
    });
}

/**
 * @param {{qs?: AllContentHomeQuery, headers?: module:http.IncomingHttpHeaders}} params
 * @returns {Promise<Array<BroadcastLink>>}
 */
SteamBadgeUnlocker.prototype.getBroadcastTrendLinks = function (params = {}) {
    const self = this;
    return new Promise((resolve, reject) => {
        self.getAllContentHome('broadcasts', params).then((body) => {
            /** @type {Array<BroadcastLink>} */
            const links = [];
            const pattern = /https?:\/\/(www\.)?steamcommunity\.com\/broadcast\/watch\/(\d+)/;
            const matches = body.match(new RegExp(pattern, 'g'));
            if (matches) {
                for (let link of matches) {
                    const match = link.match(pattern);
                    links.push({
                        url: match[0],
                        watchId: match[2],
                    });
                }
            }

            resolve(links);
        }, (e) => reject(e));
    });
}

/** @typedef {{url: string, watchId: string}} BroadcastLink */
/** @typedef {{
 * broadcastid: string,
 * cdn_auth_url_parameters: null,
 * eresult: number,
 * heartbeat_interval: number,
 * hls_url: string,
 * is_replay: number,
 * is_rtmp: number,
 * is_webrtc: null,
 * num_viewers: number,
 * retry: number,
 * success: 'ready'|string,
 * title: string,
 * url: string,
 * viewertoken: string,
 * webrtc_offer_sdp: null,
 * webrtc_session_id: null,
 * webrtc_turn_server: null,
 * }} BroadcastMpd
 */
