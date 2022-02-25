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
