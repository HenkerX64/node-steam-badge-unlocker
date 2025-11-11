const SteamID = require('steamid');
const fs = require('fs');

module.exports = SteamCommunityMock;

function SteamCommunityMock(options = {}) {
	this.getSessionID = () => 'a0000000000000000000000f';
	this.steamID = new SteamID(options.steamId || '76000000000000000');
	this._cookies = [];
	this.setCookies = (cookies) => this._cookies = cookies;

	const createResult = (id, errorText = 'Error Fail', compareId = '1000') => {
		return id === compareId ? null : new Error(errorText);
	};
	const resultById = (id, callback) => {
		return callback(createResult(id));
	};

	this.getSteamUser = (id, callback) => callback(createResult(id), {
		vacBanned: false,
		tradeBanState: 'None',
		isLimitedAccount: false,
		customURL: 'test',
	});
	this.removeFriend = (steamId, callback) => callback(createResult(steamId, 'Malformed JSON response', '76000000000000001'));
	this.addFriend = (steamId, callback) => callback(createResult(steamId, 'Unknown error', '76000000000000001'));
	this.joinGroup = resultById;
	this.leaveGroup = resultById;
	this.deleteProfileStatus = resultById;
	this.postProfileStatus = (statusText, options, callback) => callback(createResult(statusText), 1000);
	this.postUserComment = (steamId, message, callback) => callback(createResult(message), '1000');
	this.deleteUserComment = (steamId, commentId, callback) => callback(createResult(steamId, 'Failed to delete comment'));
	this.editProfile = (settings, callback) => callback(createResult(settings.realName, 'Error', 'John'));
	this.getWebApiKey = (domain, callback) => callback(null, 'test');

	this.chatLogon = () => null;
	this.chatLogoff = () => null;
	this.chatMessage = (steamId, text, type, callback) => callback(createResult(steamId));
	this.on = (eventType, callback) => {
		switch (eventType) {
			case 'chatLogOnFailed':
				return setTimeout(() => callback(new Error('Error Fail')), 200);
			case 'chatLoggedOn':
				return setTimeout(() => callback(), 200);
		}
		callback();
	};

	/**
	 * @param {'badges'|'badges2'|'getugcuploadform'|'ugcupload'|'screenshots'|'videos'|'points_shop'|'videos_add'|'videos'|'broadcast_trends'|'videos_link_youtube'} filename
	 * @returns {string}
	 */
	const getHtmlPageFixture = (filename) => {
		return fs.readFileSync(__dirname + '/../fixtures/pages/' + filename + '.html', 'utf8');
	};

	const response = {statusCode: 200};
	this.resultStack = [];
	/** @param {Array<Array<null|Error, null|{statusCode: number}, string|Object>>} results */
	this.setResultStack = (results = []) => this.resultStack = results;
	this.httpRequest = (params, callback) => {
		if (this.resultStack.length > 0) {
			const result = this.resultStack.shift();
			return callback(result[0], result[1] || response, result[2]);
		}
		switch (params.url) {
			case 'https://steamcommunity.com/id/test/badges/2':
			case 'https://steamcommunity.com/profiles/76000000000000000/badges/2':
				return callback(null, response, getHtmlPageFixture('badges2'));
			case 'https://steamcommunity.com/id/test/badges':
			case 'https://steamcommunity.com/id/test/badges/':
			case 'https://steamcommunity.com/profiles/76000000000000000/badges':
			case 'https://steamcommunity.com/profiles/76000000000000000/badges/':
				return callback(null, response, getHtmlPageFixture('badges'));
			case 'https://steamcommunity.com/id/test/ajaxcraftbadge/':
			case 'https://steamcommunity.com/profiles/76000000000000000/ajaxcraftbadge/':
				if (params.form.appid !== 1000) {
					const errorResponse = {...response, statusCode: 500};
					const errorObj = new Error('HTTP error ' + errorResponse.statusCode);
					errorObj.code = errorResponse.statusCode;
					return callback(errorObj, errorResponse, null);
				}
				return callback(null, response, require('../fixtures/ajaxcraftbadge.json'));
			case 'https://steamcommunity.com/id/test/videos/add/':
			case 'https://steamcommunity.com/profiles/76000000000000000/videos/add/':
				if (this._cookies.filter(cookie => cookie.match(/youtube_accesstoken=.*access_token/)).length === 0) {
					return callback(null, response, getHtmlPageFixture('videos_link_youtube'));
				}
				return callback(null, response, getHtmlPageFixture('videos_add'));
			case 'https://steamcommunity.com/id/test/videos/':
			case 'https://steamcommunity.com/profiles/76000000000000000/videos/':
				return callback(null, response, getHtmlPageFixture('videos'));
			case 'https://steamcommunity.com/id/test/ajaxgetusernews/':
			case 'https://steamcommunity.com/profiles/76000000000000000/ajaxgetusernews/':
				return callback(null, response, params.start ? {success: false} : require('../fixtures/ajaxgetusernews.json'));
			case 'https://steamcommunity.com/id/test/recommended/':
			case 'https://steamcommunity.com/profiles/76000000000000000/recommended/':
				return callback(null, response, '');
			case 'https://steamcommunity.com/actions/LogFriendActivityUpvote':
				return callback(null, response, 'null');
			case 'https://steamcommunity.com/ogg/1000/selectAvatar':
			case 'https://steamcommunity.com/ogg/582660/selectAvatar':
				return callback(null, response, require('../fixtures/selectavatar.json'));
			case 'https://api.steampowered.com/IPlayerService/SetProfileBackground/v1/':
				return callback(null, response, require('../fixtures/setprofilebackground.json'));
			case 'https://api.steampowered.com/IPlayerService/GetProfileItemsOwned/v1/':
				return callback(null, response, require('../fixtures/getprofileitemsowned.json'));
			case 'https://store.steampowered.com/friends/recommendgame':
				return callback(null, response, {success: true, strError: ''});
			case 'https://steamcommunity.com/broadcast/getbroadcastmpd/':
				return callback(null, response, require('../fixtures/getbroadcastmpd.json'));
			case 'https://api.steampowered.com/IPlayerService/GetCommunityBadgeProgress/v1/':
				return callback(null, response, require('../fixtures/getcommunitybadgeprogress.json'));
			case 'https://store.steampowered.com/explore/generatenewdiscoveryqueue':
				return callback(null, response, require('../fixtures/generatenewdiscoveryqueue.json'));
			case 'https://store.steampowered.com/api/addtowishlist':
				return callback(null, response, require('../fixtures/addtowishlist.json'));
			case 'https://store.steampowered.com/api/removefromwishlist':
				return callback(null, response, require('../fixtures/removefromwishlist.json'));
			case 'https://steamcommunity.com/comment/PublishedFile_Public/post/76000000000000001/1000/':
				return callback(null, response, require('../fixtures/publishedfile.json').post);
			case 'https://steamcommunity.com/comment/PublishedFile_Public/delete/76000000000000001/1000/':
				return callback(null, response, require('../fixtures/publishedfile.json').delete);
			case 'https://steamcommunity.com/comment/UserStatusPublished/upvote/76000000000000001/1000000000/':
				return callback(null, response, require('../fixtures/userstatuspublished.json').upvote);
			case 'https://steamcommunity.com/sharedfiles/delete':
			case 'https://steamcommunity.com/sharedfiles/filedetails/':
			case 'https://steamcommunity.com/discussions/forum/search/':
			case 'https://store.steampowered.com/app/10':
				return callback(null, response, '<html lang="en"></html>');
			case 'https://steamcommunity.com/apps/allcontenthome/':
				let result = '<div></div>';
				if (params.qs.appHubSubSection === 13) {
					result = getHtmlPageFixture('broadcast_trends');
				}
				return callback(null, response, result);
			case 'https://steamcommunity.com/profiles/1000/screenshots/':
				return callback(null, response, getHtmlPageFixture('screenshots'));
			case 'https://steamcommunity.com/sharedfiles/subscribe':
			case 'https://steamcommunity.com/sharedfiles/unsubscribe':
			case 'https://steamcommunity.com/sharedfiles/voteup':
			case 'https://steamcommunity.com/sharedfiles/votedown':
				return callback(null, response, {success: 1});
			case 'https://store.steampowered.com/points/shop':
				return callback(null, response, getHtmlPageFixture('points_shop'));
			case 'https://steamcommunity.com/sharedfiles/edititem/767/3/':
				return callback(null, response, getHtmlPageFixture('getugcuploadform'));
			case 'https://ufs00373.steamcontent.com:8693/ugcupload':
				return callback(null, response, getHtmlPageFixture('ugcupload'));
		}
		callback(new Error(params.url));
	};
	this.httpRequestGet = this.httpRequest;
}
