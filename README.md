# Steam Community Badge Unlocker for Node.js

[![npm version](https://img.shields.io/npm/v/steam-badge-unlocker.svg)](https://npmjs.com/package/steam-badge-unlocker)
[![license](https://img.shields.io/npm/l/steam-badge-unlocker.svg)](https://github.com/HenkerX64/node-steam-badge-unlocker/blob/master/LICENSE)

This module extends the [node-steamcommunity](https://github.com/DoctorMcKay/node-steamcommunity) library with additional functionality to automate Steam community badge tasks.  
It is designed for users who manage multiple Steam accounts and want to complete community-related achievements efficiently.

> **Note:** Users with one or two accounts are encouraged to complete these tasks manually for a better Steam experience.

## Installation

Install from [npm](https://www.npmjs.com/package/steam-badge-unlocker):

```bash
npm install steam-badge-unlocker
```

or with peer dependencies:

```bash
npm install steam-badge-unlocker steamcommunity steam-user
```

## Configuration

Default configuration is located in [`resources/OCommunityLeaderDefault.js`](resources/OCommunityLeaderDefault.js).  
All values can be overridden when initializing the class.

```javascript
const communityLeaderOptions = {
	// Enables the "AddFriendToFriendsList" task when true.
	// Ensures both accounts become friends by initiating a mutual friend request.
	// When false, the script assumes the existing friendship should be used.
	forceAddFriend: true,
	forceRemoveFriend: true,
	wishlistAppId: 1195460,

// To enable the YouTube linking task, link your YouTube account with Steam first:
// 1. Go to https://steamcommunity.com/my/videos/link (Profile > Videos > Link YouTube account)
// 2. Click "Access your YouTube videos" (green button)
// 3. Select your Google account when redirected to YouTube
// 4. After successful linking, Steam shows "Successfully linked your YouTube account"
// 5. In Chrome, open Developer Tools (F12) -> Application -> Storage -> Cookies -> https://steamcommunity.com
// 6. Copy the "Value" of cookies:
//    - youtube_accesstoken  → youtubeCookies.accessToken
//    - youtube_authaccount  → youtubeCookies.authAccount
// Requirements:
// - Your YouTube account must have at least one uploaded video (can be "unlisted")
// - If Steam can list your video for linking, the configuration is valid
// Note: YouTube access tokens expire periodically and must be refreshed when expired (PostVideo: false).
	youtubeCookies: {
		accessToken: null,
		authAccount: '',
		refreshToken: 'null',
	},
	workshopFileId: '308490450',
	workshopAppId: 730,
	reviewAppId: 730,
	playAppId: 730,
	playSeconds: 330,

	// SteamUser instance for playing task
	steamUser: null,

	/** @type {function|null} (optional) */
	log: null,
	/**
	 * Master instance should invite limited accounts and interact with slave instances.
	 * @type {SteamCommunity|null} (optional)
	 */
	masterInstance: null,
};
```

## Usage

This library must be integrated into an existing **node-steamcommunity** project.

```javascript
const SteamCommunity = require('steamcommunity');
const SteamBadgeUnlocker = require('steam-badge-unlocker');

const community = new SteamCommunity();
// login with community or SteamUser
// ... after login:
const badgeUnlocker = new SteamBadgeUnlocker(community);
const communityLeader = badgeUnlocker.createCommunityLeader(communityLeaderOptions);

await communityLeader.start();

// Optional: perform additional actions here
// Note: during `finish()`, the master friend will be removed if `forceRemoveFriend: true`.
// If you plan to trade or complete more tasks, insert your code between start() and finish().

await communityLeader.finish();
```

### Master / Slave Setup

In multi-account setups, one account can act as a **master**, coordinating multiple **slave** accounts.

- The master account should have:
	- At least one **public screenshot**
	- **Activity** in the Steam feed (for rating and commenting)
	- **Open profile** settings (public visibility)

- Slave accounts will automatically:
	- Add the master account as a friend (if not already)
	- Post comments on the master’s profile and screenshots
	- Send chat messages with emoticons
	- Interact with the master’s activity feed (rate up)

The master instance invites and manages interactions between accounts using:
```javascript
const masterCommunity = new SteamCommunity();
// login with community or SteamUser...
const slaveCommunity = new SteamCommunity();
// login with community or SteamUser...

communityLeaderOptions.masterInstance = masterCommunity;
const badgeUnlocker = new SteamBadgeUnlocker(slaveCommunity);
const communityLeader = badgeUnlocker.createCommunityLeader(communityLeaderOptions);
```

## Supported Tasks

### Community Leader Badge (23+ automated tasks)

[<img src="https://community.cloudflare.steamstatic.com/public/images/badges/01_community/communityleader_80.png" width="32px" height="32px" title="Community Leader (27+ completed quests)">](https://steamcommunity.com/my/badges/2)
<img src="https://community.cloudflare.steamstatic.com/public/images/badges/01_community/community03_80.png" width="32px" height="32px" title="Community Ambassador (21+ completed quests)">
<img src="https://community.cloudflare.steamstatic.com/public/images/badges/01_community/community02_80.png" width="32px" height="32px" title="Pillar of Community (13+ completed quests)">

1. Add comment on friend's profile
2. Add comment on friend's screenshot
3. Add friend
4. Add game to wishlist
5. Craft game badge (_requires 1 full set of trading cards in inventory_)
6. Select favorite badge
7. Join a group
8. Post a screenshot
9. Post a status
10. Post a video
11. Rate up content in activity feed
12. Rate up workshop item
13. Recommend game
14. Search in discussions
15. Set profile background (_requires background item_)
16. Set avatar
17. Set real name
18. Subscribe to workshop item
19. Use discovery queue
20. View broadcast
21. View guide in Steam overlay
22. Play game (_requires [steam-user](https://github.com/DoctorMcKay/node-steam-user)_)
23. Use emotion in chat (_requires [steam-user](https://github.com/DoctorMcKay/node-steam-user)_)

Disabled (manual or ToS-restricted):

24. Trade (**disabled**, _requires [steam-tradeoffer-manager](https://github.com/DoctorMcKay/node-steam-tradeoffer-manager)_)
25. Buy or Sell item on Community Market (**disabled**, _see Steam ToS_)
26. Add 2FA to account (**disabled**)
27. Add phone to account (**disabled**)
28. Setup Steam Guard account (**disabled**)

> This library completes 21+ tasks, reaching at least the "Community Ambassador" level.  
> Accounts with limited access (<5 USD spent) can complete ~13 tasks (Pillar of Community).  
> Banned accounts may not be eligible for all tasks.  
> Playing tasks require a running Steam client or [steam-user](https://github.com/DoctorMcKay/node-steam-user).


## Documentation

See full documentation on the [GitHub Wiki](https://github.com/HenkerX64/node-steam-badge-unlocker/wiki).

## Support

Report issues on the [GitHub issue tracker](https://github.com/HenkerX64/node-steam-badge-unlocker/issues).

## License

MIT License
