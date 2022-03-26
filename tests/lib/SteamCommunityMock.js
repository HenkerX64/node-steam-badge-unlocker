const SteamID = require('steamid');

module.exports = SteamCommunityMock;

function SteamCommunityMock(options = {}) {
	this.getSessionID = () => 'a0000000000000000000000f';
	this.steamID = new SteamID('76000000000000000');
	this._cookies = [];
	this.setCookies = (cookies) => this._cookies = cookies;

	const createResult = (id, errorText = 'Error Fail') => {
		return id === '1000' ? null : new Error(errorText);
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
	this.removeFriend = resultById;
	this.addFriend = resultById;
	this.joinGroup = resultById;
	this.leaveGroup = resultById;
	this.deleteProfileStatus = resultById;
	this.postProfileStatus = (statusText, options, callback) => callback(createResult(statusText), 1000);
	this.postUserComment = (steamId, message, callback) => callback(createResult(message), '1000');
	this.deleteUserComment = (steamId, commentId, callback) => callback(createResult(steamId, 'Failed to delete comment'));
	this.editProfile = (settings, callback) => callback(createResult(settings.realName));
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

	const response = {statusCode: 200};
	this.httpRequest = (params, callback) => {
		switch (params.url) {
			case 'https://store.steampowered.com/explore/generatenewdiscoveryqueue':
				return callback(null, response, require('./results/generatenewdiscoveryqueue.json'));
			case 'https://store.steampowered.com/app/10':
				return callback(null, response, '<html lang="en"></html>');
			case 'https://steamcommunity.com/apps/allcontenthome/':
				return callback(null, response, '<div></div>');
			case 'https://steamcommunity.com/profiles/1000/screenshots/':
				return callback(null, response, "<br>\n<a data-publishedfileid=\"1000\"");
			case 'https://store.steampowered.com/points/shop':
				return callback(null, response, "webapi_token&quot;:&quot;a000000000000000000000000000000f&quot;");
		}
		callback(new Error(params.url));
	};
	this.httpRequestGet = this.httpRequest;
}
