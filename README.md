# Steam Community Badge Unlocker for Node.js

[![npm version](https://img.shields.io/npm/v/steam-badge-unlocker.svg)](https://npmjs.com/package/steam-badge-unlocker)
[![license](https://img.shields.io/npm/l/steam-badge-unlocker.svg)](https://github.com/HenkerX64/node-steam-badge-unlocker/blob/master/LICENSE)

Completes the quests of the Steam **Community Leader** badge (badge 2) for your bot accounts. It works on
your logged-in [steamcommunity](https://www.npmjs.com/package/steamcommunity) instances and
adds the Steam actions that `steamcommunity` and `steam-user` do not have.

> **Note:** Users with one or two accounts are encouraged to complete these tasks manually for a better Steam experience.

## When to use it

Use it when you run several Steam accounts with `steamcommunity` and want them to complete the Community
Leader quests, or when you need one of the Steam actions listed under
[What this adds over steamcommunity](#what-this-adds-over-steamcommunity).

Do not use it:

- as a replacement for `steamcommunity`: friends, groups, comments and profile edits stay with
  `steamcommunity`; this package only adds what is missing there;
- to automate account security (Steam Guard, phone, two-factor) or the Community Market: these quests
  are not automated;
- when the accounts must not show test content: the quests post and delete a profile comment, a
  screenshot comment, a status, a screenshot, a video and a review, add and remove a wishlist entry, join
  and leave a group, and set and clear the real name;
- when lasting changes are not acceptable: the avatar, the profile background, the featured badge, the
  Workshop subscription and votes, the activity-feed votes, the chat message, the free license of the
  played game and the friend (unless `forceRemoveFriend`) stay; crafting uses up a set of trading cards; with
  `steamcommunity` 3.43–3.47 a Web API key for `localhost` is registered when the account has none.

## Installation

Install from [npm](https://www.npmjs.com/package/steam-badge-unlocker):

```bash
npm install steam-badge-unlocker steamcommunity
```

[steam-user](https://www.npmjs.com/package/steam-user) is optional. Only PlayGame and UseEmoticonInChat need it,
through the `steamUser` option: your logged-in `steam-user` client of the same account. Without it both quests are
skipped.

```bash
npm install steam-user
```

The package does not pin these libraries; install the versions your project needs. Supported:
`steamcommunity` `>=3.43.1` (tested with 3.50.3) and `steam-user` `>=5.0.0`. The package itself runs on
Node.js `>=10`; `steam-user` 5 needs Node.js `>=14`, and so do the example scripts.

## Quick start

```javascript
const SteamBadgeUnlocker = require('steam-badge-unlocker');

// masterCommunity and each bot.community: logged-in steamcommunity instances (setCookies already done)
async function runQuests(masterCommunity, bots) {
	for (const bot of bots) {
		const leader = new SteamBadgeUnlocker(bot.community).createCommunityLeader({
			masterInstance: masterCommunity,
			steamUser: bot.user,
			forceAddFriend: true,
			forceRemoveFriend: true,
		});
		await leader.start().catch(console.error);
		await leader.finish();
	}
}
```

The master is one of your accounts and the friend of all others; it runs no quests itself. Create each
`SteamBadgeUnlocker` after its web session is set: it reads the SteamID and session id once.
[Getting started](docs/getting-started.md) shows how to log the accounts in, where every piece of data
comes from and what a run logs. A complete script is
[`examples/run-community-leader.js`](examples/run-community-leader.js); a module for
[quer/the-steam-awards](https://github.com/quer/the-steam-awards) is
[`examples/the-steam-awards-module.js`](examples/the-steam-awards-module.js).

## What this adds over steamcommunity

| Task | steam-badge-unlocker | steamcommunity | steam-user |
|---|---|---|---|
| Comment on a screenshot and delete the comment | `postSharedFileComment` returns the comment id and rejects on Steam errors; `deleteSharedFileComment` checks the comment is gone | posts, but returns no comment id and ignores Steam errors | — |
| Set a profile background, list owned profile items | `setProfileBackground`, `getOwnedProfileItems` with the web session only | — | needs a Steam client connection |
| Subscribe to and rate a Workshop item | `subscribeToSharedFile`, `voteSharedFile` | `CSteamSharedFile.subscribe` subscribes to comments only | — |
| Upload a screenshot | `uploadScreenshot` | — | — |
| Share a YouTube video | `fetchYoutubeVideos`, `postYoutubeVideo` | — | — |
| Wishlist an app | `addToWishlist`, `removeFromWishlist` | — | — |
| Finish a discovery queue | `finishDiscoveryQueue` | — | — |
| Watch a broadcast | `getBroadcastTrendLinks`, `getBroadcastManifest` | — | — |
| View a guide as the in-game overlay | `getSharedFileDetails` with the overlay user agent | — | — |
| Select an official game avatar | `selectAvatar` | `uploadAvatar` uploads an own image only | — |
| Craft a game badge, feature a badge | `craftBadge`, `getAppIdsReadyForCrafting`, `setFavoriteBadge` | — | — |
| Review a game | `addGameRecommendation`, `deleteGameRecommendation` | — | — |
| Rate friend activity | `getLastFriendPosts`, `voteContent`, `logFriendActivityUpvote` | — | — |
| Read Community Leader quest progress | `getCommunityBadgeProgress`, `getCommunityBadgeProgressFromProfile` | — | `getGameBadgeLevel` (game badges only) |

Compared with steamcommunity 3.50.3 and steam-user 5.3.0. `get`/`post` send your own requests through the
same session, and `steam-badge-unlocker/components/helpers` holds small helpers; everything declared in the
type declarations is public API under semver.

## Community Leader quests

[<img src="https://community.cloudflare.steamstatic.com/public/images/badges/01_community/communityleader_80.png" width="32px" height="32px" title="Community Leader (27+ completed quests)">](https://steamcommunity.com/my/badges/2)
<img src="https://community.cloudflare.steamstatic.com/public/images/badges/01_community/community03_80.png" width="32px" height="32px" title="Community Ambassador (21+ completed quests)">
<img src="https://community.cloudflare.steamstatic.com/public/images/badges/01_community/community02_80.png" width="32px" height="32px" title="Pillar of Community (13+ completed quests)">

23 of the 28 quests are automated. How many a run completes depends on what you provide:

| You provide | Full account | Limited account |
|---|---|---|
| a logged-in `steamcommunity` | 14 | 11 |
| + a friend (master account) and Steam Guard enabled | 18 | 15 |
| + `steamUser` | 20 | 17 |
| + YouTube cookies | 21 | 18 |
| + one full set of trading cards and a profile background (dropped by crafting or owned) | 23 | 20 |

The counts assume that each quest succeeds with its default target, e.g. a live broadcast exists and the
account can review Counter-Strike 2 (app 730); with `steamUser`, PlayGame adds its free license first.
FeatureBadgeOnProfile needs the badge unlocked, which Steam does after 13 completed quests; without a friend
and `steamUser` a new account usually completes it in a second run. Running again is safe, `start()` only runs
open quests. Limited accounts
rarely get trading cards (no card drops, no trading). The security quests you complete by hand count on top.

Not automated: BuyOrSellOnMarket (against the Steam Subscriber Agreement), AddTwoFactorToAccount,
AddPhoneToAccount and SetupSteamGuard (account security stays with the owner), Trade (not implemented, it would
need [steam-tradeoffer-manager](https://www.npmjs.com/package/steam-tradeoffer-manager)). Every quest with its
requirements and what it leaves behind: [task catalog](docs/tasks.md).

## Documentation

- [Getting started](docs/getting-started.md): accounts and login, master account, where the data comes
  from, options, reading a run, error codes, Steam limits.
- [Task catalog](docs/tasks.md): every quest with its method, requirements and what stays on the account.
- [`index.d.ts`](index.d.ts): type declarations with the full API.

The docs, the examples and the type declarations ship with the npm package, for example
`node_modules/steam-badge-unlocker/docs/getting-started.md`.

## Support

Report issues on the [GitHub issue tracker](https://github.com/HenkerX64/node-steam-badge-unlocker/issues).

## License

MIT License
