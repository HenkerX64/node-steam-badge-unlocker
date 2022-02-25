const SteamBadgeUnlocker = require('../index.js');
const DefaultOptions = require('../resources/OCommunityLeaderDefault');
const {delay} = require('../components/helpers');

const fs = require('fs');
const masterInstanceCache = {
	friendSteamId: null,
	friendsScreenshotFileId: null,
};

/**
 * @param {SteamCommunity} _community
 * @returns {Promise<string|null>}
 */
function getFirstScreenshotId(_community) {
	return new Promise((resolve) => {
		const friendSteamId = _community.steamID.toString();
		if (masterInstanceCache.friendSteamId === friendSteamId) {
			resolve(masterInstanceCache.friendsScreenshotFileId);
			return;
		}
		_community.httpRequestGet({
			url: `https://steamcommunity.com/profiles/${friendSteamId}/screenshots/`,
			qs: {
				l: 'english',
				appid: 0,
				sort: 'newestfirst',
				browsefilter: 'myfiles',
				view: 'grid',
				privacy: 30,
			},
		}, (error, response, body) => {
			let friendsScreenshotFileId = null;
			if (!error && body) {
				const firstFile = body.match(/data-publishedfileid="(\d+)"/);
				if (firstFile) {
					friendsScreenshotFileId = firstFile[1];
				}
			}
			masterInstanceCache.friendSteamId = friendSteamId;
			masterInstanceCache.friendsScreenshotFileId = friendsScreenshotFileId;
			resolve(friendsScreenshotFileId);
		});
	});
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

/**
 * @param {OCommunityLeaderDefault} options
 * @returns {CCommunityLeader}
 */
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
 * @param {OCommunityLeaderDefault} options
 * @constructor
 */
function CCommunityLeader(communityBadge, options) {
	this._badgeUnlocker = communityBadge;
	this._community = communityBadge.getCommunity();
	this.options = {
		...DefaultOptions,
		...(options || {}),
	};
	this.isLimitedAccount = false;
	this.vacBanned = false;
	this.tradeBanState = false;

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
		if (!this.options.friendSteamId) {
			this.options.friendSteamId = this.options.masterInstance.steamID.toString();
			if (!this.options.friendsScreenshotFileId) {
				this.options.friendsScreenshotFileId = await getFirstScreenshotId(this.options.masterInstance).catch(() => null);
				this.log('-', {friendsScreenshotFileId: this.options.friendsScreenshotFileId});
			}
		}
	}

	/** @returns {Promise<Array<CommunityBadgeQuest>>} */
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

	this.start = async function () {
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
		await new Promise((resolve) => {
			const self = this;
			this._community.getSteamUser(this._community.steamID, (e, user) => {
				if (!e) {
					self.isLimitedAccount = user.isLimitedAccount;
					self.vacBanned = user.vacBanned;
					self.tradeBanState = (user.tradeBanState !== 'None');
					if (user.customURL) {
						self._badgeUnlocker.setCustomProfileUrl(user.customURL);
					}
				}
				resolve();
			});
		});
		const executeAll = async (questsNames) => {
			let i;
			for (let questName of questsNames) {
				this.log(questName, await this[questName]());
				i = openQuests.filter(quest => !!quest).findIndex(quest => quest.name === questName);
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
				this.log(questName, await this[questName]());
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
		if (!this.isLimitedAccount && !this.tradeBanState) {
			await execute(['Trade']);
		}
		await execute([
			'CraftGameBadge',
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
		if (openQuestsBefore !== openQuests.length) {
			await delay(2);
		}
		const openQuestsAfter = (await getOpenQuests()).length;
		const solvedQuests = openQuestsBefore - openQuestsAfter;
		this.log('-', {openQuests: openQuestsAfter, solvedQuests});
		// steam client only
		// vac banned account
	}
	this.finish = function () {
		return new Promise((resolve) => {
			if (this.options.forceRemoveFriend) {
				this._community.removeFriend(this.options.friendSteamId, (e) => resolve(!e))
			} else {
				resolve(true);
			}
		});
	}
}

/**
 * Add a new friend to your friends list.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.AddFriendToFriendsList = function () {
	return new Promise(async (resolve) => {
		if (this.options.masterInstance) {
			await new Promise((resolve2) => {
				this.options.masterInstance.addFriend(this._badgeUnlocker.getSteamId(), () => resolve2());
			});
			await delay(1);
		}
		this._community.addFriend(this.options.friendSteamId, (e) => resolve(!e));
	});
}

/**
 * Browse games on the Steam Store and select one to add to your wishlist.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.AddItemToWishlist = function () {
	return new Promise(async (resolve) => {
		const appId = this.options.wishlistAppId;
		const response = await this._badgeUnlocker.addToWishlist(appId).catch(() => null);
		if (response && response.success) {
			// (optional) clean up
			await this._badgeUnlocker.removeFromWishlist(appId).catch(() => null);
			resolve(true);
			return;
		}
		resolve(false);
	})
}

/**
 * Complete a set of trading cards and craft them into a game badge.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.CraftGameBadge = function () {
	return new Promise(async (resolve) => {
		let appId = this.options.craftGameBadgeAppId;
		if (!appId) {
			const apps = await this._badgeUnlocker.getAppIdsReadyForCrafting().catch(() => []);
			if (apps.length === 0) {
				resolve(false);
				return;
			}
			appId = apps[0];
		}
		resolve(!!await this._badgeUnlocker.craftBadge(appId).catch(() => null));
	});
}

/**
 * Visit your Badges page and select your favorite.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.FeatureBadgeOnProfile = function () {
	return this._badgeUnlocker.setFavoriteBadge(this.options.featureBadgeId).catch(() => false);
}

/**
 * Browse some existing Steam Groups and join up.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.JoinGroup = function () {
	return new Promise((resolve) => {
		const self = this;
		self._community.joinGroup(self.options.joinGroupId, (e) => {
			if (e) {
				resolve(false);
				return;
			}
			if (!self.options.leaveGroupAutomatically) {
				resolve(true);
				return;
			}
			self._community.leaveGroup(self.options.joinGroupId, () => resolve(true));
		});
	});
}

/**
 * Visit a friend's profile page and add a new comment.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.PostCommentOnFriendsPage = function () {
	return new Promise((resolve) => {
		const self = this;
		self._community.postUserComment(self.options.friendSteamId, self.options.friendsPageComment, (error, commentId) => {
			if (error) {
				resolve(false);
				return;
			}
			// cleanup
			self._community.deleteUserComment(self.options.friendSteamId, commentId, () => resolve(true));
		});
	});
}

/**
 * Visit your friend's screenshot pages and add a new comment.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.PostCommentOnFriendsScreenshot = function () {
	return new Promise(async (resolve) => {
		const commentId = await this._badgeUnlocker.postSharedFileComment(this.options.friendSteamId, this.options.friendsScreenshotFileId, this.options.friendsScreenshotComment, 5).catch(() => null);
		if (commentId) {
			// cleanup
			await this._badgeUnlocker.deleteSharedFileComment(this.options.friendSteamId, this.options.friendsScreenshotFileId, commentId, 5).catch(() => null);
			resolve(true);
			return;
		}
		resolve(false);
	});
}

/**
 * Press your screenshot key (usually F12) while in a game to take a new screenshot, and then publish it to your friends.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.PostScreenshot = function () {
	return new Promise(async (resolve) => {
		const file = fs.createReadStream(this.options.screenshotPath);
		const response = await this._badgeUnlocker.uploadScreenshot(this.options.screenshotAppId, this.options.screenshotTitle, this.options.screenshotDescription, file).catch(() => null);
		if (response) {
			await this._badgeUnlocker.deleteSharedFile(response.id, this.options.screenshotAppId, 'screenshots');
			resolve(true);
			return;
		}
		resolve(false);
	});
}

/**
 * Visit your Activity Feed to post a status.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.PostStatusToFriends = function () {
	return new Promise((resolve) => {
		const self = this;
		self._community.postProfileStatus(self.options.statusText, {appID: self.options.statusAppId}, (error, postId) => {
			if (error) {
				resolve(false);
				return;
			}
			self._community.deleteProfileStatus(postId, () => resolve(true));
		});
	});
}

/**
 * Visit your videos page to pick a new video to share.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.PostVideo = function () {
	return new Promise(async (resolve) => {
		this._badgeUnlocker.setYoutubeCookies(this.options.youtubeCookies);
		if (!this.options.youtubeId) {
			const videos = await this._badgeUnlocker.fetchYoutubeVideos().catch(() => []);
			if (videos.length === 0) {
				resolve(false);
				return;
			}
			this.options.youtubeId = videos[0].youtubeId;
		}
		const postedVideos = await this._badgeUnlocker.postYoutubeVideo(this.options.youtubeId).catch(() => 0);
		if (postedVideos > 0) {
			const videos = await this._badgeUnlocker.getProfileVideos().catch(() => []);
			for (let video of videos) {
				if (video.youtubeId === this.options.youtubeId) {
					await this._badgeUnlocker.deleteSharedFile(video.fileId, 0, 'videos').catch(() => null);
					break;
				}
			}
			resolve(true);
			return;
		}
		resolve(false);
	});
}

/**
 * Visit your Activity Feed and rate up any content from a friend or content author you follow.
 * @returns {Promise<true>}
 */
CCommunityLeader.prototype.RateUpContentInActivityFeed = function () {
	return new Promise(async (resolve) => {
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
		resolve(true);
	});
}

/**
 * Visit the Steam Workshop and choose an item to thumbs up.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.RateWorkshopItem = function () {
	return this._badgeUnlocker.voteSharedFile(this.options.workshopFileId).catch(() => false);
}

/**
 * Choose a new game from your games list to review.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.RecommendGame = function () {
	return new Promise(async (resolve) => {
		const response = await this._badgeUnlocker.addGameRecommendation(this.options.reviewAppId, this.options.reviewText).catch(() => null);
		if (response && response.success) {
			await this._badgeUnlocker.deleteGameRecommendation(this.options.reviewAppId).catch(() => null);
			resolve(true);
			return;
		}
		resolve(false);
	});
}

/**
 * Use the discussions search to find a topic that interests you.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.SearchInDiscussions = function () {
	return new Promise(async (resolve) => {
		const html = await this._badgeUnlocker.discussionsSearch(this.options.discussionsKeyword).catch(() => null);
		resolve(!!html);
	});
}

/**
 * Profile backgrounds are dropped during trading card crafting and are tradable.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.SetProfileBackground = function () {
	return new Promise(async (resolve) => {
		const items = await this._badgeUnlocker.getOwnedProfileItems().catch(() => null);
		if (items && items.response.profile_backgrounds && items.response.profile_backgrounds.length > 0) {
			const result = await this._badgeUnlocker.setProfileBackground(items.response.profile_backgrounds[0].communityitemid).catch(() => null);
			resolve(!!result);
			return;
		}
		resolve(false);
	});
}

/**
 * Edit your community profile to set an avatar.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.SetupCommunityAvatar = function () {
	return this._badgeUnlocker.selectAvatar(this.options.avatarAppId, this.options.avatarIndex).catch(() => false);
}

/**
 * Edit your community profile to set a real name. Any name will work, but setting your real name will help your friends know who you are.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.SetupCommunityRealName = function () {
	return new Promise((resolve) => {
		const self = this;
		self._community.editProfile({realName: self.options.realName}, (e) => {
			if (!e) {
				resolve(false);
				return;
			}
			if (!self.options.resetRealName) {
				resolve(true);
				return;
			}
			self._community.editProfile({realName: ''}, () => resolve(true));
		});
	});
}

/**
 * Visit the Steam Workshop and choose an item to subscribe to.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.SubscribeToWorkshopItem = function () {
	return this._badgeUnlocker.subscribeToSharedFile(this.options.workshopFileId, this.options.workshopAppId).catch(() => false);
}

/**
 * Use Steam Trading to make a trade.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.Trade = function () {
	return new Promise((resolve) => {
		// not ready
		resolve(false);
	});
}

/**
 * Visit the Steam Store and complete a discovery queue.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.UseDiscoveryQueue = function () {
	return new Promise((resolve) => {
		this._badgeUnlocker.finishDiscoveryQueue().then(() => resolve(true), () => resolve(false));
	});
}

/**
 * Visit the broadcasts page on the Steam Community and watch someone else play!
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.ViewBroadcast = function () {
	return new Promise(async (resolve) => {
		let broadcastWatchId = this.options.broadcastWatchId;
		if (!broadcastWatchId) {
			/** @type {Array<BroadcastLink>} */
			const links = await this._badgeUnlocker.getBroadcastTrendLinks().catch(() => []);
			if (links.length === 0) {
				resolve(false);
				return;
			}
			broadcastWatchId = links[0].watchId;
		}
		const response = await this._badgeUnlocker.getBroadcastManifest(broadcastWatchId).catch(() => null);
		resolve(!!(response && response.success === 'ready'));
	});
}

/**
 * While in game, open the Steam Overlay and browse the available game guides.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.ViewGuideInOverlay = function () {
	return new Promise(async resolve => {
		let guideFileId = this.options.guideFileId;
		if (!guideFileId) {
			/** @type {Array<GuideLink>} */
			const links = await this._badgeUnlocker.getGuidesTrendLinks().catch(() => []);
			if (links.length === 0) {
				resolve(false);
				return;
			}
			guideFileId = links[0].guideId;
		}
		this._badgeUnlocker.getSharedFileDetails(guideFileId, {
			headers: {
				'User-Agent': this.options.steamOverlayUserAgent,
				'Referer': 'https://steamcommunity.com/?subsection=guides',
			},
		}).then(() => resolve(true), () => resolve(false));
	});
}

// ---- SteamUser required, not possible with browser session


/**
 * Launch any game from your games list in the Steam Client.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.PlayGame = function () {
	return new Promise(async (resolve) => {
		const steamUser = this.options.steamUser;
		if (!steamUser) {
			resolve(false);
			return;
		}
		await steamUser.requestFreeLicense([this.options.playAppId]);

		steamUser.gamesPlayed([{game_id: this.options.playAppId}], true);
		setTimeout(() => {
			steamUser.gamesPlayed([]);
			resolve(true);
		}, 1000 * this.options.playSeconds);
	});
}

/**
 * :yay: Find and use a Steam Emoticon in chat. Emoticons are dropped when crafting trading cards and are tradable.
 * @returns {Promise<boolean>}
 */
CCommunityLeader.prototype.UseEmoticonInChat = function () {
	return new Promise(async (resolve) => {
		const steamUser = this.options.steamUser;
		if (steamUser) {
			const result = await steamUser.chat.sendFriendMessage(this.options.friendSteamId, this.options.emotionMessageText, {});
			resolve(!!result);
			return;
		}
		// deprecated, but working option
		if (typeof this._community.chatLogon === 'function') {
			const self = this;
			this._community.on('chatLogOnFailed', () => resolve(false));
			this._community.on('chatLoggedOn', () => {
				self._community.chatMessage(self.options.friendSteamId, self.options.emotionMessageText, 'saytext', (e) => {
					self._community.chatLogoff();
					resolve(!e);
				});
			});
			this._community.chatLogon();
			return;
		}

		resolve(false);
	});
}


// ---- Manual action required


/**
 * @returns {Promise<null>}
 * @deprecated Manual quests or violates steam ToS.
 */
function disabledQuest() {
	return new Promise((resolve) => resolve(null));
}

/** (Violates steam ToS) Buy or Sell an item from your Inventory on the Community Market. */
CCommunityLeader.prototype.BuyOrSellOnMarket = disabledQuest;

/** (manual) Download the Steam Mobile App on your iOS or Android device, and use it to log into your Steam Account. */
CCommunityLeader.prototype.AddTwoFactorToAccount = disabledQuest;
/** (manual) Visit your account details page and add a phone number to your account, in case you ever lose access to your login credentials. */
CCommunityLeader.prototype.AddPhoneToAccount = disabledQuest;
/** (manual) Use the Steam Settings dialog to enable Steam Guard. */
CCommunityLeader.prototype.SetupSteamGuard = disabledQuest;
