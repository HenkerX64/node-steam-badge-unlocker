const SteamBadgeUnlocker = require('../index.js');
const DefaultOptions = require('../resources/OCommunityLeaderDefault');
const {delay, createError, getAccessDeniedError, withMissingRequiredHeaders} = require('../components/helpers');
const EErrorCode = require('../resources/EErrorCode');

const fs = require('fs');
const {promisify} = require('util');
const masterInstanceCache = {
	friendSteamId: null,
	friendsScreenshotFileId: null,
};

/**
 * @param {Object} target
 * @param {string} method
 * @param {...*} args
 * @returns {Promise<*>}
 */
async function callbackCall(target, method, ...args) {
	return promisify(target[method]).apply(target, args);
}

/**
 * @param {import('../index').SteamCommunityLike} _community
 * @param {string} language
 * @returns {Promise<string|null>}
 */
async function getFirstScreenshotId(_community, language) {
	const friendSteamId = String(_community.steamID);
	if (masterInstanceCache.friendSteamId === friendSteamId) {
		return masterInstanceCache.friendsScreenshotFileId;
	}
	const body = await new Promise((resolve) => {
		_community.httpRequestGet({
			url: `https://steamcommunity.com/profiles/${friendSteamId}/screenshots/`,
			qs: {
				l: language,
				appid: 0,
				sort: 'newestfirst',
				browsefilter: 'myfiles',
				view: 'grid',
				privacy: 30,
			},
		}, (error, response, responseBody) => resolve(error ? null : responseBody));
	});
	const firstFile = body ? body.match(/data-publishedfileid="(\d+)"/) : null;
	const friendsScreenshotFileId = firstFile ? firstFile[1] : null;
	if (body !== null) {
		masterInstanceCache.friendSteamId = friendSteamId;
		masterInstanceCache.friendsScreenshotFileId = friendsScreenshotFileId;
	}
	return friendsScreenshotFileId;
}

/**
 * @param {CCommunityLeader} leader
 * @param {Error|null} error
 */
function setLastError(leader, error) {
	leader._lastError = error || null;
}

/**
 * @template {CCommunityLeader} T
 * @param {function(this: T): (boolean|null|Promise<boolean|null>)} quest
 * @returns {function(this: T): Promise<boolean|null>}
 */
function withLastError(quest) {
	return async function () {
		setLastError(this, null);
		try {
			return await quest.call(this);
		} catch (error) {
			setLastError(this, error);
			return false;
		}
	};
}

/**
 * @param {CCommunityLeader} leader
 * @param {keyof typeof import('../resources/EErrorCode')} code
 * @returns {false}
 */
function skipQuest(leader, code) {
	setLastError(leader, createError(code));
	return false;
}

/**
 * @param {CCommunityLeader} leader
 * @param {string} questName
 * @returns {function(this: CCommunityLeader): Promise<boolean|null>}
 */
function guardOverriddenQuest(leader, questName) {
	const quest = leader[questName];
	return quest === CCommunityLeader.prototype[questName] ? quest : withLastError(quest);
}

/**
 * @param {boolean|null} result
 * @param {ReturnType<import('../index').CCommunityLeader['getLastError']>} error
 * @returns {boolean|null|string|number}
 */
function questLogValue(result, error) {
	if (result === true) {
		return 'OK';
	}
	if (error) {
		return error.code || error.message || String(error);
	}
	return result;
}

/**
 * @param {Date} d
 * @returns {string}
 */
function formatDate(d) {
	return ('0' + d.getDate()).slice(-2)
		+ '-' + ('0' + (d.getMonth() + 1)).slice(-2)
		+ '-' + d.getFullYear()
		+ ' ' + ('0' + d.getHours()).slice(-2)
		+ ':' + ('0' + d.getMinutes()).slice(-2);
}

/** @type {import('../index')['createCommunityLeader']} */
SteamBadgeUnlocker.prototype.createCommunityLeader = function (options) {
	return new CCommunityLeader(this, options);
};

/**
 * This class should help gamers to finish community leader badge.
 *
 * Using of automatic resolving of community quests is not recommended.
 * Steam created this quests for better experience with steam platform.
 * You should yourself find a way to solve the quests. After you know this,
 * you will be able to know how steam works and what you can do on this platform.
 *
 * But if you have multiple accounts, and you don't want to do the same for every account,
 * you can use this tool to finish the quests and level up your accounts.
 *
 * @param {SteamBadgeUnlocker} communityBadge
 * @param {Partial<import('../index').CommunityLeaderOptions>|null} [options]
 * @constructor
 */
function CCommunityLeader(communityBadge, options) {
	this._badgeUnlocker = communityBadge;
	this._community = communityBadge.getCommunity();
	/** @type {Array<import('../index').CraftedDroppedItem>} dropped items after crafting */
	this._rgDroppedItems = [];
	this.options = {
		...DefaultOptions,
		...(options || {}),
	};
	this.isLimitedAccount = false;
	this.vacBanned = false;
	this.tradeBanState = false;
	/** @type {ReturnType<import('../index').CCommunityLeader['getLastError']>} */
	this._lastError = null;
	this._accessDenied = null;

	/**
	 * @param {string} key
	 * @param {*} value
	 */
	function logger(key, value) {
		// noinspection JSForgottenDebugStatementInspection
		console.log(formatDate(new Date()), '-', communityBadge.getSteamId(), '-', `${key.padStart(30, ' ')}`, value);
	}

	this.log = this.options.log || logger;

	this.init = async function () {
		if (!this.options.masterInstance) {
			return;
		}
		const masterSteamID = String(this.options.masterInstance.steamID);
		if (!this.options.friendSteamId) {
			this.options.friendSteamId = masterSteamID;
		}
		if (!this.options.friendsScreenshotFileId && this.options.friendSteamId === masterSteamID) {
			this.options.friendsScreenshotFileId = await getFirstScreenshotId(this.options.masterInstance, this._badgeUnlocker.getLanguage()).catch(() => null);
			this.log('-', {friendsScreenshotFileId: this.options.friendsScreenshotFileId});
		}
	}

	/** @returns {Promise<Array<import('../index').CommunityBadgeQuest>>} */
	const getOpenQuests = async () => {
		let apiKey = '';
		if (this.options.fetchBadgesWithApiKey && !this.isLimitedAccount) {
			apiKey = await this._badgeUnlocker.getWebApiKey().catch(() => '');
		}
		let progress;
		if (apiKey === '') {
			progress = await this._badgeUnlocker.getCommunityBadgeProgressFromProfile(2);
		} else {
			progress = await this._badgeUnlocker.getCommunityBadgeProgress(apiKey, 2);
		}
		if (!progress.response.quests) {
			this.log('error', 'not able to get badge progress');
			return [];
		}
		return progress.response.quests.filter(quest => !quest.completed);
	}

	const throwIfAccessDenied = (questName) => {
		const lastError = this.getLastError();
		const denied = this._accessDenied || (lastError && lastError.code === EErrorCode.ACCESS_DENIED ? lastError : null);
		if (!denied) {
			return;
		}
		if (questName) {
			denied.quest = questName;
			this.log(questName, EErrorCode.ACCESS_DENIED);
		}
		setLastError(this, denied);
		throw denied;
	};
	const runStart = async () => {
		setLastError(this, null);
		await this.init();
		const openQuests = (await getOpenQuests()).map(quest => ({
			id: quest.questid,
			name: SteamBadgeUnlocker.ECommunityBadgeQuests[quest.questid],
		}));
		const openQuestsBefore = openQuests.length;
		this.log('-', {openQuests: openQuestsBefore});
		if (openQuestsBefore === 0) {
			await this.finish();
			return;
		}
		const user = await callbackCall(this._community, 'getSteamUser', this._community.steamID).catch(() => null);
		throwIfAccessDenied();
		if (user) {
			this.isLimitedAccount = user.isLimitedAccount;
			this.vacBanned = user.vacBanned;
			this.tradeBanState = (user.tradeBanState !== 'None');
			if (user.customURL) {
				this._badgeUnlocker.setCustomProfileUrl(user.customURL);
			}
		}
		const runQuest = async (questName) => {
			const result = await guardOverriddenQuest(this, questName).call(this);
			throwIfAccessDenied(questName);
			this.log(questName, questLogValue(result, this.getLastError()));
		};
		const executeAll = async (questsNames) => {
			let i;
			for (let questName of questsNames) {
				await runQuest(questName);
				i = openQuests.findIndex(quest => quest && quest.name === questName);
				if (openQuests[i]) {
					delete openQuests[i];
				}
			}
		};
		const execute = async (questsNames) => {
			for (let i in openQuests) {
				const questName = openQuests[i].name;
				if (!questsNames.includes(questName)) {
					continue;
				}
				await runQuest(questName);
				delete openQuests[i];
			}
		};
		// add game
		// simple quests:
		await execute([
			'AddItemToWishlist',
			'SearchInDiscussions',
			'SetupCommunityAvatar',
			'SetupCommunityRealName',
			'SubscribeToWorkshopItem',
			'UseDiscoveryQueue',
			'ViewBroadcast',
			'ViewGuideInOverlay',
			'PostScreenshot',
			'PostStatusToFriends',
			'PostVideo',
			'JoinGroup',
		]);
		// friends only
		const friendQuests = ['AddFriendToFriendsList'];
		if (this.options.forceAddFriend) {
			await executeAll(friendQuests);
		}
		// To post this comment, your account must have Steam Guard enabled.
		if (openQuests.filter(quest => !!quest).findIndex(quest => quest.name === 'SetupSteamGuard') < 0) {
			friendQuests.push('PostCommentOnFriendsPage');
		}
		await execute(friendQuests.concat([
			'RateUpContentInActivityFeed',
			'UseEmoticonInChat',
		]));
		if (!this.tradeBanState) {
			await execute(['Trade']);
		}
		// add delay after crafting
		if (openQuests.findIndex(quest => quest && quest.name === 'CraftGameBadge') >= 0) {
			await execute(['CraftGameBadge']);
			await delay(1);
		}
		await execute([
			'PlayGame',
			'SetProfileBackground',
			'FeatureBadgeOnProfile',
		]);
		if (!this.isLimitedAccount) {
			await execute([
				'PostCommentOnFriendsScreenshot',
				'RecommendGame',
			]);
		}
		if (!this.isLimitedAccount && !this.vacBanned) {
			await execute(['RateWorkshopItem']);
		}
		if (openQuestsBefore !== openQuests.filter(quest => !!quest).length) {
			await delay(2);
		}
		const openQuestsAfter = (await getOpenQuests()).length;
		const solvedQuests = openQuestsBefore - openQuestsAfter;
		this.log('-', {openQuests: openQuestsAfter, solvedQuests});
		// steam client only
		// vac banned account
	};
	this.start = async () => {
		this._accessDenied = null;
		const communities = [this._community, this.options.masterInstance].filter((community, i, all) => community
			&& typeof community.on === 'function' && typeof community.removeListener === 'function' && all.indexOf(community) === i);
		const onResponse = (requestId, source, options, error, response, body) => {
			this._accessDenied = this._accessDenied || getAccessDeniedError(response, body, options);
		};
		communities.forEach(community => community.on('postHttpRequest', onResponse));
		try {
			await runStart();
		} catch (error) {
			if (this._accessDenied && error !== this._accessDenied) {
				setLastError(this, this._accessDenied);
				throw this._accessDenied;
			}
			throw error;
		} finally {
			communities.forEach(community => community.removeListener('postHttpRequest', onResponse));
		}
	};
	this.finish = async function () {
		if (!this.options.forceRemoveFriend || !this.options.friendSteamId) {
			return true;
		}
		return callbackCall(this._community, 'removeFriend', this.options.friendSteamId).then(() => true, () => false);
	}
}

/**
 * Add a new friend to your friends list.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.AddFriendToFriendsList = async function () {
	if (!this.options.friendSteamId) {
		return skipQuest(this, EErrorCode.SKIP_MISSING_FRIEND);
	}
	if (this.options.masterInstance) {
		await callbackCall(this.options.masterInstance, 'addFriend', this._badgeUnlocker.getSteamId()).catch(() => null);
		await delay(1);
	}
	await callbackCall(this._community, 'addFriend', this.options.friendSteamId);
	return true;
}

/**
 * Browse games on the Steam Store and select one to add to your wishlist.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.AddItemToWishlist = async function () {
	const appId = this.options.wishlistAppId;
	const response = await this._badgeUnlocker.addToWishlist(appId);
	if (!response || !response.success) {
		return false;
	}
	// (optional) clean up
	await this._badgeUnlocker.removeFromWishlist(appId).catch(() => null);
	return true;
}

/**
 * Complete a set of trading cards and craft them into a game badge.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.CraftGameBadge = async function () {
	this._rgDroppedItems = [];
	let appId = this.options.craftGameBadgeAppId;
	if (!appId) {
		const apps = await this._badgeUnlocker.getAppIdsReadyForCrafting();
		if (apps.length === 0) {
			return false;
		}
		appId = apps[0];
	}
	const result = await this._badgeUnlocker.craftBadge(appId);
	if (result && result.success && typeof result.rgDroppedItems !== 'undefined') {
		this._rgDroppedItems = result.rgDroppedItems;
	}
	return !!result;
}

/**
 * Visit your Badges page and select your favorite.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.FeatureBadgeOnProfile = function () {
	return this._badgeUnlocker.setFavoriteBadge(this.options.featureBadgeId);
}

/**
 * Browse some existing Steam Groups and join up.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.JoinGroup = async function () {
	await callbackCall(this._community, 'joinGroup', this.options.joinGroupId);
	if (!this.options.leaveGroupAutomatically) {
		return true;
	}
	await callbackCall(this._community, 'leaveGroup', this.options.joinGroupId).catch(() => null);
	return true;
}

/**
 * Visit a friend's profile page and add a new comment.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.PostCommentOnFriendsPage = async function () {
	if (!this.options.friendSteamId) {
		return skipQuest(this, EErrorCode.SKIP_MISSING_FRIEND);
	}
	const commentId = await callbackCall(this._community, 'postUserComment', this.options.friendSteamId, this.options.friendsPageComment);
	// cleanup
	await callbackCall(this._community, 'deleteUserComment', this.options.friendSteamId, commentId).catch(() => null);
	return true;
}

/**
 * Visit your friend's screenshot pages and add a new comment.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.PostCommentOnFriendsScreenshot = async function () {
	if (!this.options.friendSteamId) {
		return skipQuest(this, EErrorCode.SKIP_MISSING_FRIEND);
	}
	const commentId = await this._badgeUnlocker.postSharedFileComment(this.options.friendSteamId, this.options.friendsScreenshotFileId, this.options.friendsScreenshotComment, 5);
	if (!commentId) {
		return false;
	}
	// cleanup
	await this._badgeUnlocker.deleteSharedFileComment(this.options.friendSteamId, this.options.friendsScreenshotFileId, commentId, 5).catch(() => null);
	return true;
}

/**
 * Press your screenshot key (usually F12) while in a game to take a new screenshot, and then publish it to your friends.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.PostScreenshot = async function () {
	const file = fs.createReadStream(this.options.screenshotPath);
	const response = await this._badgeUnlocker.uploadScreenshot(this.options.screenshotAppId, this.options.screenshotTitle, this.options.screenshotDescription, file);
	if (!response) {
		return false;
	}
	await this._badgeUnlocker.deleteSharedFile(response.id, this.options.screenshotAppId, 'screenshots').catch(() => null);
	return true;
}

/**
 * Visit your Activity Feed to post a status.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.PostStatusToFriends = async function () {
	const postId = await callbackCall(this._community, 'postProfileStatus', this.options.statusText, {appID: this.options.statusAppId});
	await callbackCall(this._community, 'deleteProfileStatus', postId).catch(() => null);
	return true;
}

/**
 * Visit your videos page to pick a new video to share.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.PostVideo = async function () {
	if (!this.options.youtubeCookies || !this.options.youtubeCookies.accessToken) {
		return skipQuest(this, EErrorCode.SKIP_MISSING_YOUTUBE_ACCESS_TOKEN);
	}
	this._badgeUnlocker.setYoutubeCookies(this.options.youtubeCookies);
	if (!this.options.youtubeId) {
		const videos = await this._badgeUnlocker.fetchYoutubeVideos();
		if (videos.length === 0) {
			return false;
		}
		this.options.youtubeId = videos[0].youtubeId;
	}
	const fileIdsBefore = (await this._badgeUnlocker.getProfileVideos()).map(video => video.fileId);
	const postedVideos = await this._badgeUnlocker.postYoutubeVideo(this.options.youtubeId);
	if (postedVideos <= 0) {
		return false;
	}
	const videos = await this._badgeUnlocker.getProfileVideos().catch(() => []);
	for (let video of videos) {
		if (video.youtubeId === this.options.youtubeId && fileIdsBefore.indexOf(video.fileId) === -1) {
			await this._badgeUnlocker.deleteSharedFile(video.fileId, 0, 'videos').catch(() => null);
			break;
		}
	}
	return true;
}

/**
 * Visit your Activity Feed and rate up any content from a friend or content author you follow.
 * @returns {Promise<true>}
 */
CCommunityLeader.prototype.RateUpContentInActivityFeed = async function () {
	// 1. vote up screenshot file.
	// friend posted it in the past, and it was in activity
	await this._badgeUnlocker.voteSharedFile(this.options.friendsScreenshotFileId).catch(() => null);
	// 2. vote something from activity feed, probably nothing will be found
	const activity = await this._badgeUnlocker.getLastFriendPosts(2).catch(() => []);
	for (let params of activity) {
		const response = await this._badgeUnlocker.voteContent({
			...params,
			action: 'upvote',
		}).catch(() => null);
		if (response && response.success) {
			break;
		}
	}
	await this._badgeUnlocker.logFriendActivityUpvote().catch(() => null);
	return true;
}

/**
 * Visit the Steam Workshop and choose an item to thumbs up.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.RateWorkshopItem = function () {
	return this._badgeUnlocker.voteSharedFile(this.options.workshopFileId);
}

/**
 * Choose a new game from your games list to review.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.RecommendGame = async function () {
	const response = await this._badgeUnlocker.addGameRecommendation(this.options.reviewAppId, this.options.reviewText);
	if (!response || !response.success) {
		return false;
	}
	await this._badgeUnlocker.deleteGameRecommendation(this.options.reviewAppId).catch(() => null);
	return true;
}

/**
 * Use the discussions search to find a topic that interests you.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.SearchInDiscussions = async function () {
	const html = await this._badgeUnlocker.discussionsSearch(this.options.discussionsKeyword);
	return !!html;
}

/**
 * Profile backgrounds are dropped during trading card crafting and are tradable.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.SetProfileBackground = async function () {
	const item = this._rgDroppedItems.find(item => item.label === 'Background');
	if (item && item.economy_hover_data) {
		const idMatches = item.economy_hover_data.match(/^753\/\d\/(\d+)\/\d+/);
		if (idMatches && idMatches.length > 1) {
			const result = await this._badgeUnlocker.setProfileBackground(idMatches[1]);
			return !!result;
		}
	}

	const items = await this._badgeUnlocker.getOwnedProfileItems();
	if (items && items.response.profile_backgrounds && items.response.profile_backgrounds.length > 0) {
		const result = await this._badgeUnlocker.setProfileBackground(items.response.profile_backgrounds[0].communityitemid);
		return !!result;
	}
	return false;
}

/**
 * Edit your community profile to set an avatar.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.SetupCommunityAvatar = function () {
	return this._badgeUnlocker.selectAvatar(this.options.avatarAppId, this.options.avatarIndex);
}

/**
 * Edit your community profile to set a real name. Any name will work, but setting your real name will help your friends know who you are.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.SetupCommunityRealName = async function () {
	await this._badgeUnlocker.setRealName(this.options.realName);
	if (!this.options.resetRealName) {
		return true;
	}
	await delay(this.options.resetRealNameAfterSeconds);
	await this._badgeUnlocker.setRealName('').catch(() => null);
	return true;
}

/**
 * Visit the Steam Workshop and choose an item to subscribe to.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.SubscribeToWorkshopItem = async function () {
	await this._badgeUnlocker.subscribeToSharedFile(this.options.workshopFileId, this.options.workshopAppId);
	await this._badgeUnlocker.unsubscribeFromSharedFile(this.options.workshopFileId, this.options.workshopAppId).catch(() => null);
	return true;
}

/**
 * Use Steam Trading to make a trade.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.Trade = async function () {
	// not ready
	return false;
}

/**
 * Visit the Steam Store and complete a discovery queue.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.UseDiscoveryQueue = async function () {
	await this._badgeUnlocker.finishDiscoveryQueue();
	return true;
}

/**
 * Visit the broadcasts page on the Steam Community and watch someone else play!
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.ViewBroadcast = async function () {
	let broadcastWatchId = this.options.broadcastWatchId;
	if (!broadcastWatchId) {
		/** @type {Array<import('../index').BroadcastLink>} */
		const links = await this._badgeUnlocker.getBroadcastTrendLinks();
		if (links.length === 0) {
			return false;
		}
		broadcastWatchId = links[0].watchId;
	}
	const response = await this._badgeUnlocker.getBroadcastManifest(broadcastWatchId);
	return !!(response && response.success === 'ready');
}

/**
 * While in game, open the Steam Overlay and browse the available game guides.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.ViewGuideInOverlay = async function () {
	let guideFileId = this.options.guideFileId;
	if (!guideFileId) {
		/** @type {Array<import('../index').GuideLink>} */
		const links = await this._badgeUnlocker.getGuidesTrendLinks();
		if (links.length === 0) {
			return false;
		}
		guideFileId = links[0].guideId;
	}
	await this._badgeUnlocker.getSharedFileDetails(guideFileId, {
		headers: {
			'User-Agent': this.options.steamOverlayUserAgent,
			'Referer': 'https://steamcommunity.com/?subsection=guides',
		},
	});
	return true;
}

// ---- SteamUser required, not possible with browser session


/**
 * Launch any game from your games list in the Steam Client.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.PlayGame = async function () {
	const steamUser = this.options.steamUser;
	if (!steamUser) {
		return skipQuest(this, EErrorCode.SKIP_MISSING_STEAM_USER);
	}
	await Promise.resolve(steamUser.requestFreeLicense([this.options.playAppId])).catch(() => null);

	steamUser.gamesPlayed([{game_id: this.options.playAppId}], true);
	await delay(this.options.playSeconds);
	steamUser.gamesPlayed([]);
	return true;
}

/**
 * :yay: Find and use a Steam Emoticon in chat. Emoticons are dropped when crafting trading cards and are tradable.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.UseEmoticonInChat = async function () {
	if (!this.options.friendSteamId) {
		return skipQuest(this, EErrorCode.SKIP_MISSING_FRIEND);
	}
	if (!this.options.steamUser) {
		return skipQuest(this, EErrorCode.SKIP_MISSING_STEAM_USER);
	}
	const result = await this.options.steamUser.chat.sendFriendMessage(this.options.friendSteamId, this.options.emotionMessageText, {});
	return !!result;
}


/** @type {import('../index').CCommunityLeader['getLastError']} */
CCommunityLeader.prototype.getLastError = function () {
	return this._lastError;
}

// ---- Manual action required


/**
 * @returns {Promise<null>}
 * @deprecated Manual quests or violates steam ToS.
 */
async function disabledQuest() {
	return null;
}

/** (Violates steam ToS) Buy or Sell an item from your Inventory on the Community Market. */
CCommunityLeader.prototype.BuyOrSellOnMarket = disabledQuest;

/** (manual) Download the Steam Mobile App on your iOS or Android device, and use it to log into your Steam Account. */
CCommunityLeader.prototype.AddTwoFactorToAccount = disabledQuest;
/** (manual) Visit your account details page and add a phone number to your account, in case you ever lose access to your login credentials. */
CCommunityLeader.prototype.AddPhoneToAccount = disabledQuest;
/** (manual) Use the Steam Settings dialog to enable Steam Guard. */
CCommunityLeader.prototype.SetupSteamGuard = disabledQuest;

Object.keys(SteamBadgeUnlocker.ECommunityBadgeQuests)
	.filter(questName => typeof SteamBadgeUnlocker.ECommunityBadgeQuests[questName] === 'number')
	.forEach((questName) => {
		CCommunityLeader.prototype[questName] = withLastError(CCommunityLeader.prototype[questName]);
	});
