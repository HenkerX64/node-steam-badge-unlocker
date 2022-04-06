const {isSteamId, parseConfigString} = require('../components/helpers');
const SteamBadgeUnlocker = require('../index');
const SteamCommunity = require('steamcommunity');
const SteamTotp = require('steam-totp');
const assert = require('assert');

const accounts = parseConfigString(process.env.TEST_ACCOUNTS);
const masterInstance = new SteamCommunity();

describe('Unlimited account', () => {
	if (accounts.length === 0) {
		it.skip('Missing valid test accounts. Skipped.');
		return;
	}
	let _badgeUnlocker;
	it('login', async () => {
		await (new Promise((resolve, reject) => {
			try {
				const loginDetails = {
					accountName: accounts[0].accountName,
					password: accounts[0].password,
					disableMobile: true,
				};
				if (accounts[0].secret !== '') {
					loginDetails.twoFactorCode = SteamTotp.getAuthCode(accounts[0].secret);
				}
				masterInstance.login(loginDetails, (error) => {
					if (error !== null) {
						reject(new Error('Not able to login'));
						return;
					}
					resolve();
				});
			} catch (e) {
				reject(new Error('Something went wrong on login'));
			}
		}));
		_badgeUnlocker = new SteamBadgeUnlocker(masterInstance);
		assert.ok(true);
	});

	it('getApiKey()', async () => {
		const apiKey = await _badgeUnlocker.getWebApiKey();
		assert.ok(typeof apiKey === 'string');
		assert.strictEqual(32, apiKey.length, 'ApiKey should be 32 characters long');
	});

	it('getCommunityBadgeProgress()', async () => {
		const result = await _badgeUnlocker.getCommunityBadgeProgress(await _badgeUnlocker.getWebApiKey());
		assert.strictEqual(typeof result, 'object');
		assert.strictEqual(typeof result.response.quests, 'object');
		assert.strictEqual(result.response.quests.length, 28);
	});
	it('getCommunityBadgeProgressFromProfile()', async () => {
		const result = await _badgeUnlocker.getCommunityBadgeProgressFromProfile();
		assert.strictEqual(typeof result, 'object');
		assert.strictEqual(typeof result.response.quests, 'object');
		assert.strictEqual(result.response.quests.length, 28);
	});
	it('getWorkshopTrendLinks()', async () => {
		const links = await _badgeUnlocker.getWorkshopTrendLinks();
		assert.strictEqual(typeof links, 'object');
		assert.ok(links.length > 0);
		assert.ok(/^\d+/.test(links[0].fileId));
	});
	it('getGuidesTrendLinks()', async () => {
		const links = await _badgeUnlocker.getGuidesTrendLinks();
		assert.strictEqual(typeof links, 'object');
		assert.ok(links.length > 0);
		assert.ok(/^\d+/.test(links[0].guideId));
	});
	it('getOwnedProfileItems()', async () => {
		const result = await _badgeUnlocker.getOwnedProfileItems();
		assert.ok(typeof result === 'object');
		assert.ok(typeof result.response === 'object');
	});
	it('getLastFriendPosts()', async () => {
		const result = await _badgeUnlocker.getLastFriendPosts();
		assert.ok(typeof result === 'object');
	});
	it('logFriendActivityUpvote()', async () => {
		const result = await _badgeUnlocker.logFriendActivityUpvote();
		assert.strictEqual(result, 'null');
	});
	it.skip('getProfileVideos()', async () => {
		const result = await _badgeUnlocker.getProfileVideos();
		assert.ok(typeof result === 'object');
		assert.ok(result.length > 0);
	});
	it('getBroadcastTrendLinks() && getBroadcastManifest()', async () => {
		const links = await _badgeUnlocker.getBroadcastTrendLinks();
		assert.strictEqual(typeof links, 'object');
		assert.ok(links.length > 0);
		assert.ok(isSteamId(links[0].watchId));

		const result = await _badgeUnlocker.getBroadcastManifest(links[0].watchId);
		assert.strictEqual(typeof result, 'object');
		assert.strictEqual(result.success, 'ready');
	});
	it('createCommunityLeader()', async () => {
		const leader = _badgeUnlocker.createCommunityLeader({
			masterInstance: null,
			log: () => {
			},
		});
		await leader.init();
		assert.ok(await leader.AddItemToWishlist(), 'AddItemToWishlist()');
		assert.ok(await leader.SearchInDiscussions(), 'SearchInDiscussions()');
		assert.ok(await leader.ViewGuideInOverlay(), 'ViewGuideInOverlay()');
		// assert.ok(leader.ViewBroadcast(), 'ViewBroadcast()');
		// assert.ok(await leader.UseDiscoveryQueue(), 'UseDiscoveryQueue()');
		assert.ok(await leader.BuyOrSellOnMarket() === null);
		assert.ok(await leader.AddTwoFactorToAccount() === null);
		assert.ok(await leader.AddPhoneToAccount() === null);
		assert.ok(await leader.SetupSteamGuard() === null);
	}, 20000);
});

describe('Unlimited account + Master', () => {
	if (accounts.length < 2) {
		it.skip('Missing master account. Skipped.');
		return;
	}

	it('createCommunityLeader()', async () => {
		const secondInstance = new SteamCommunity();
		await (new Promise((resolve, reject) => {
			try {
				const loginDetails = {
					accountName: accounts[1].accountName,
					password: accounts[1].password,
					disableMobile: true,
				};
				if (accounts[1].secret !== '') {
					loginDetails.twoFactorCode = SteamTotp.getAuthCode(accounts[1].secret);
				}
				secondInstance.login(loginDetails, (error) => {
					if (error !== null) {
						reject(new Error('Not able to login'));
						return;
					}
					resolve();
				});
			} catch (e) {
				reject(new Error('Something went wrong on login'));
			}
		}));
		const _badgeUnlocker = new SteamBadgeUnlocker(secondInstance);
		const leader = _badgeUnlocker.createCommunityLeader({
			masterInstance,
			log: () => {
			},
		});
		await leader.init();
		assert.ok(leader.options.friendSteamId !== null);
		assert.ok(leader.options.friendsScreenshotFileId !== null);
	}, 20000);
});
