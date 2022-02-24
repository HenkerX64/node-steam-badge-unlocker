module.exports = SteamBadgeUnlocker;

/**
 * @param {SteamCommunity} SteamCommunity
 * @param {{apiKey?: string, apiToken?: string, customUrl?: string}} options
 * @constructor
 */
function SteamBadgeUnlocker(SteamCommunity, options = {}) {
    // !SteamCommunity instanceof community
    if (typeof SteamCommunity !== 'object' || typeof SteamCommunity.getSessionID !== 'function') {
        throw new Error('SteamCommunity instance required');
    }

    options = options || {};

}

