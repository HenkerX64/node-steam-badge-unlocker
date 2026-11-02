const SteamBadgeUnlocker = require('../index');

/**
 * @param {{qs?: AllContentHomeQuery, headers?: module:http.IncomingHttpHeaders}} params
 * @returns {Promise<Array<GuideLink>>}
 */
SteamBadgeUnlocker.prototype.getGuidesTrendLinks = async function (params = {}) {
	const body = await this.getAllContentHome('guides', params);
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

	return links;
}

/** @typedef {{url: string, guideId: string}} GuideLink */
