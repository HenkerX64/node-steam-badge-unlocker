const SteamID = require('steamid');

module.exports = SteamCommunityMock;

function SteamCommunityMock(options = {}) {
	this.getSessionID = () => 'a0000000000000000000000f';
	this.steamID = new SteamID('76000000000000000');
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
				return callback(null, response, 'Completed all Steam Community tasks!');
			case 'https://steamcommunity.com/id/test/badges':
			case 'https://steamcommunity.com/profiles/76000000000000000/badges':
				return callback(null, response, 'This badge is featured on your profile');
			case 'https://steamcommunity.com/id/test/badges/':
			case 'https://steamcommunity.com/profiles/76000000000000000/badges/':
				return callback(
					null,
					response,
					"\t<div class=\"badge_progress_info\">\n"
					+ "\t<a href=\"https://steamcommunity.com/id/test/gamecards/730/\" class=\"badge_craft_button\">\n"
					+ "\t\t\t\t\t\t\t\t\t\t\tReady\t\t\t\t\t\t\t\t\t\t</a>\n"
					+ "\t</div>"
				);
			case 'https://steamcommunity.com/id/test/ajaxcraftbadge/':
			case 'https://steamcommunity.com/profiles/76000000000000000/ajaxcraftbadge/':
				return callback(null, response, {success: 1});
			case 'https://steamcommunity.com/id/test/videos/add/':
			case 'https://steamcommunity.com/profiles/76000000000000000/videos/add/':
				if (this._cookies.filter(cookie => cookie.match(/youtube_accesstoken=.*access_token/)).length === 0) {
					return callback(null, response, 'Access your YouTube videos');
				}
				return callback(
					null,
					response,
					"<div id=\"results_box\">Successfully added 1 video</div>\n"
					+ "\t\t\t\t<div class=\"add_vid_list_entry\">\n"
					+ "\t\t\t\t\t<div class=\"add_vid_cb\"><input class=\"vid_cb\" type=\"checkbox\" name=\"videos[]\" value=\"test2\" onchange=\"UpdateAddVideoControls()\" /></div>\n"
					+ "\t\t\t\t\t<div class=\"vid_thumb list_vid_thumb_add\"><div class=\"vid_thumb_duration\"></div><img src=\"https://i.ytimg.com/vi/test2/mqdefault.jpg\" width=\"120\" height=\"90\" /></div>\n"
					+ "\t\t\t\t\t<div class=\"vid_list_title_add\">Test2 description</div>\n"
					+ "\t\t\t\t\t<div class=\"vid_list_date\">Jan 1, 2000 00:00PM</div>\n"
					+ "\t\t\t\t\t<br clear=\"left\" />\n"
					+ "\t\t\t\t</div>"
				);
			case 'https://steamcommunity.com/id/test/videos/':
			case 'https://steamcommunity.com/profiles/76000000000000000/videos/':
				return callback(
					null,
					response,
					"\t\t\t\t\t<div class=\"video_item\">\n"
					+ "\t\t\t\t<a href=\"https://steamcommunity.com/sharedfiles/filedetails/?id=1600000000\" onclick=\"return OnVideoClicked( 1600000000 );\" class=\"profile_media_item modalContentLink auto_height\">\n"
					+ "\t\t\t\t\t<div class=\"imgWallItem\" id=\"imgWallItem_1600000000\">\n"
					+ "\t\t\t\t\t\t<div style=\"position: relative;\" >\n"
					+ "\t\t\t\t\t\t\t<input type=\"checkbox\" style=\"position: absolute; display: none;\" name=\"screenshots[1600000000]\" class=\"screenshot_checkbox\" id=\"screenshot_checkbox_1600000000\" />\n"
					+ "\t\t\t\t\t\t</div>\n"
					+ "\t\t\t\t\t\t<div class=\"imgWallHover\" id=\"imgWallHover1600000000\">\n"
					+ "\t\t\t\t\t\t\t<div class=\"imgWallHoverBottom\">\n"
					+ "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t<div class=\"imgWallHoverDescription\">\n"
					+ "\t\t\t\t\t\t\t\t\t\t<span class=\"ellipsis\">Test description</span>\n"
					+ "\t\t\t\t\t\t\t\t\t</div>\n"
					+ "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t</div>\n"
					+ "\t\t\t\t\t\t</div>\n"
					+ "\t\t\t\t\t\t<img src=\"https://img.youtube.com/vi/test/mqdefault.jpg\" width=\"100%\" >\n"
					+ "\t\t\t\t\t</div>\n"
					+ "\t\t\t\t</a>\n"
					+ "\t\t\t</div>"
				);
			case 'https://steamcommunity.com/broadcast/getbroadcastmpd/':
				return callback(null, response, require('./results/getbroadcastmpd.json'));
			case 'https://api.steampowered.com/IPlayerService/GetCommunityBadgeProgress/v1/':
				return callback(null, response, require('./results/getcommunitybadgeprogress.json'));
			case 'https://store.steampowered.com/explore/generatenewdiscoveryqueue':
				return callback(null, response, require('./results/generatenewdiscoveryqueue.json'));
			case 'https://store.steampowered.com/api/addtowishlist':
				return callback(null, response, require('./results/addtowishlist.json'));
			case 'https://store.steampowered.com/api/removefromwishlist':
				return callback(null, response, require('./results/removefromwishlist.json'));
			case 'https://steamcommunity.com/comment/PublishedFile_Public/post/76000000000000001/1000/':
				return callback(null, response, require('./results/publishedfile.json').post);
			case 'https://steamcommunity.com/comment/PublishedFile_Public/delete/76000000000000001/1000/':
				return callback(null, response, require('./results/publishedfile.json').delete);
			case 'https://steamcommunity.com/sharedfiles/delete':
			case 'https://steamcommunity.com/sharedfiles/filedetails/':
			case 'https://steamcommunity.com/discussions/forum/search/':
			case 'https://store.steampowered.com/app/10':
				return callback(null, response, '<html lang="en"></html>');
			case 'https://steamcommunity.com/apps/allcontenthome/':
				let result = '<div></div>';
				if (params.qs.appHubSubSection === 13) {
					result = "\t<a href=\"https://steamcommunity.com/broadcast/watch/76000000000000001\">\n" + "\t</a>\n";
				}
				return callback(null, response, result);
			case 'https://steamcommunity.com/profiles/1000/screenshots/':
				return callback(null, response, "<br>\n<a data-publishedfileid=\"1000\"");
			case 'https://steamcommunity.com/sharedfiles/subscribe':
			case 'https://steamcommunity.com/sharedfiles/unsubscribe':
			case 'https://steamcommunity.com/sharedfiles/voteup':
			case 'https://steamcommunity.com/sharedfiles/votedown':
				return callback(null, response, {success: 1});
			case 'https://store.steampowered.com/points/shop':
				return callback(null, response, "webapi_token&quot;:&quot;a000000000000000000000000000000f&quot;");
			case 'https://steamcommunity.com/sharedfiles/edititem/767/3/':
				return callback(
					null,
					response,
					"<form class=\"smallForm\" enctype=\"multipart/form-data\" method=\"POST\" name=\"SubmitItemForm\" id=\"SubmitItemForm\" action=\"https://ufs00373.steamcontent.com:8693/ugcupload\" >\n"
					// a:4:{s:5:"token";s:40:"A76A00A00A0A000AA00A00000A0AA000AA000F00";s:7:"steamID";s:17:"76000000000000000";s:9:"ipaddress";s:14:"10.100.100.100";s:6:"secure";b:1;}
					+ "<input type=\"hidden\" name=\"token\" value=\"a%3A4%3A%7Bs%3A5%3A%22token%22%3Bs%3A40%3A%22A76A00A00A0A000AA00A00000A0AA000AA000F00%22%3Bs%3A7%3A%22steamID%22%3Bs%3A17%3A%2276000000000000000%22%3Bs%3A9%3A%22ipaddress%22%3Bs%3A14%3A%2210.100.100.100%22%3Bs%3A6%3A%22secure%22%3Bb%3A1%3B%7D\">\n"
					// a:5:{s:7:"request";s:21:"PublishedFile_Publish";s:16:"valid_file_types";s:16:"jpeg,jpg,gif,png";s:13:"max_file_size";i:8388608;s:15:"consumer_app_id";i:767;s:9:"file_type";i:3;}
					+ "<input type=\"hidden\" name=\"wg\" value=\"a%3A5%3A%7Bs%3A7%3A%22request%22%3Bs%3A21%3A%22PublishedFile_Publish%22%3Bs%3A16%3A%22valid_file_types%22%3Bs%3A16%3A%22jpeg%2Cjpg%2Cgif%2Cpng%22%3Bs%3A13%3A%22max_file_size%22%3Bi%3A8388608%3Bs%3A15%3A%22consumer_app_id%22%3Bi%3A767%3Bs%3A9%3A%22file_type%22%3Bi%3A3%3B%7D\">\n"
					+ "<input type=\"hidden\" name=\"wg_hmac\" value=\"a0000000000000000000000b\">\n"
					+ "</form>"
				);
			case 'https://ufs00373.steamcontent.com:8693/ugcupload':
				return callback(null, response, '<a href="https://steamcommunity.com/sharedfiles/filedetails/?id=1000000&fileuploadsuccess=1"');
		}
		callback(new Error(params.url));
	};
	this.httpRequestGet = this.httpRequest;
}
