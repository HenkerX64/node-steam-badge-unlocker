# Options

Everything you can pass to `createCommunityLeader(options)`, what each option does and what you can put there.
Every option has a working default, so pass only what you change. The defaults live in
[`resources/OCommunityLeaderDefault.js`](../../resources/OCommunityLeaderDefault.js); `CommunityLeaderOptions`
in [`index.d.ts`](../../index.d.ts) declares the same options for your editor.

```javascript
const unlocker = new SteamBadgeUnlocker(bot.community);
const leader = unlocker.createCommunityLeader({
	masterInstance: master.community,
	steamUser: bot.user,
	forceAddFriend: true,
	forceRemoveFriend: true,
	youtubeCookies: {accessToken: process.env.YT_ACCESS_TOKEN},
	reviewAppId: 440,
});
```

`createCommunityLeader` merges your options over the defaults one level deep: an object option such as
`youtubeCookies` replaces the default object as a whole. `null` or no argument keeps every default.

## Options that turn tasks on

Without these, the tasks named here cannot do their part; each row says what happens instead. The run goes on.

| Option                    | Default                                | Turns on                                                                                                                                                                                                                                                                           | What to put there                                                                                                                                                         |
|---------------------------|----------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `masterInstance`          | `null`                                 | the friend tasks AddFriendToFriendsList, PostCommentOnFriendsPage, PostCommentOnFriendsScreenshot and UseEmoticonInChat; without a friend they log `SKIP_MISSING_FRIEND`. RateUpContentInActivityFeed runs and logs `OK` without a friend too, but then most likely does not count | the master's logged-in `steamcommunity` instance; one instance serves every bot                                                                                           |
| `steamUser`               | `null`                                 | PlayGame, UseEmoticonInChat; without it they log `SKIP_MISSING_STEAM_USER`                                                                                                                                                                                                         | the bot's logged-in `steam-user` client                                                                                                                                   |
| `youtubeCookies`          | `{accessToken: null, authAccount: ''}` | PostVideo; without it, `SKIP_MISSING_YOUTUBE_ACCESS_TOKEN`                                                                                                                                                                                                                         | `{accessToken: '<value>'}`, see [How to get the YouTube cookie](../how-to/get-the-youtube-cookie.md)                                                                      |
| `friendSteamId`           | `null`                                 | the friend tasks without a master                                                                                                                                                                                                                                                  | SteamID64 of a friend who accepts the invite; set to the master's SteamID when empty and `masterInstance` is set                                                          |
| `friendsScreenshotFileId` | `null`                                 | PostCommentOnFriendsScreenshot, RateUpContentInActivityFeed without a master; with no id the screenshot comment fails with `MISSING_FILE_ID`                                                                                                                                       | id of the friend's public screenshot, from `steamcommunity.com/sharedfiles/filedetails/?id=<id>`; when empty and the friend is the master, the master's newest screenshot |

## The friend

| Option                     | Default             | What it does                                                                                                                                                     | What to put there                                   |
|----------------------------|---------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------|
| `forceAddFriend`           | `false`             | adds the friend before the other friend tasks, even when AddFriendToFriendsList is done, as long as any task is open; the other friend tasks need the friendship | `true` together with `masterInstance`               |
| `forceRemoveFriend`        | `false`             | `finish()` removes `friendSteamId` from the friends list: the master, or the friend you named, also when the bot had that friend before                          | `true` for a friendship that lasts only for the run |
| `friendsPageComment`       | `'test'`            | text of the comment on the friend's profile (deleted again)                                                                                                      | any text                                            |
| `friendsScreenshotComment` | `'test'`            | text of the comment on the friend's screenshot (deleted again)                                                                                                   | any text                                            |
| `emotionMessageText`       | `':steamthumbsup:'` | chat message to the friend (stays)                                                                                                                               | a message with a Steam emoticon in colons           |

## What the tasks use

| Option                      | Task                                      | Default                                         | What to put there                                                                                        |
|-----------------------------|-------------------------------------------|-------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| `wishlistAppId`             | AddItemToWishlist                         | `1195460` (Last Year)                           | an app id from `store.steampowered.com/app/<id>`                                                         |
| `craftGameBadgeAppId`       | CraftGameBadge                            | `null` (the first badge that is ready to craft) | app id of a game whose full card set the bot owns                                                        |
| `featureBadgeId`            | FeatureBadgeOnProfile                     | `2` (this badge)                                | id of a badge the account has                                                                            |
| `joinGroupId`               | JoinGroup                                 | `'103582791434672565'` (Steam Universe)         | SteamID64 of a public group, a string starting with `103582791`                                          |
| `leaveGroupAutomatically`   | JoinGroup                                 | `true`                                          | `false` keeps the bot in the group                                                                       |
| `statusText`                | PostStatusToFriends                       | `'test'`                                        | any text (deleted again)                                                                                 |
| `statusAppId`               | PostStatusToFriends                       | `0` (no app)                                    | an app id the status refers to                                                                           |
| `screenshotAppId`           | PostScreenshot                            | `767`                                           | an app id                                                                                                |
| `screenshotTitle`           | PostScreenshot                            | `'test'`                                        | any text                                                                                                 |
| `screenshotDescription`     | PostScreenshot                            | `''`                                            | any text                                                                                                 |
| `screenshotPath`            | PostScreenshot                            | `resources/empty.png` (1×1 image)               | path of an image file                                                                                    |
| `youtubeId`                 | PostVideo                                 | `null` (first video of the linked account)      | a YouTube video id of the linked account                                                                 |
| `workshopFileId`            | SubscribeToWorkshopItem, RateWorkshopItem | `'308490450'`                                   | id of a Workshop item, from `steamcommunity.com/sharedfiles/filedetails/?id=<id>`                        |
| `workshopAppId`             | SubscribeToWorkshopItem                   | `730`                                           | app id of that Workshop item                                                                             |
| `reviewAppId`               | RecommendGame                             | `730` (Counter-Strike 2)                        | an app the account can review; it may have to own it                                                     |
| `reviewText`                | RecommendGame                             | `'Temporary recommendation'`                    | any text (not public, deleted again)                                                                     |
| `discussionsKeyword`        | SearchInDiscussions                       | `'GlobalDiscussionSearchForm'`                  | any search term                                                                                          |
| `realName`                  | SetupCommunityRealName                    | `'John'`                                        | any name                                                                                                 |
| `resetRealName`             | SetupCommunityRealName                    | `true`                                          | `false` keeps the name                                                                                   |
| `resetRealNameAfterSeconds` | SetupCommunityRealName                    | `5`                                             | seconds before the name is cleared                                                                       |
| `avatarAppId`               | SetupCommunityAvatar                      | `582660`                                        | an app with official avatars, see <https://steamcommunity.com/games/582660/Avatar/List>                  |
| `avatarIndex`               | SetupCommunityAvatar                      | `4`                                             | position of the avatar in that app's list                                                                |
| `broadcastWatchId`          | ViewBroadcast                             | `null` (a trending broadcast)                   | SteamID64 of a user who broadcasts live                                                                  |
| `guideFileId`               | ViewGuideInOverlay                        | `143430756`                                     | id of a guide, from `steamcommunity.com/sharedfiles/filedetails/?id=<id>`; `null` takes a trending guide |
| `steamOverlayUserAgent`     | ViewGuideInOverlay                        | the Steam overlay browser's user agent          | leave it                                                                                                 |
| `playAppId`                 | PlayGame                                  | `730` (Counter-Strike 2)                        | an app the account can play; PlayGame asks for its free license first                                    |
| `playSeconds`               | PlayGame                                  | `330`                                           | seconds the game runs; PlayGame waits that long                                                          |

## How the run works

| Option                  | Default                                 | What it does                                                                                                                                                                                                                                                                          | What to put there                                                 |
|-------------------------|-----------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------|
| `fetchBadgesWithApiKey` | `true`                                  | reads the open tasks through the Web API when the account has a Web API key, otherwise from the badge page; after the run, limited accounts are read from the badge page. Looking for the key with `steamcommunity` 3.43–3.47 registers one for `localhost` when the account has none | `false` always reads the badge page and never looks for a key     |
| `log`                   | `null` (console, with date and SteamID) | receives every log line as `(key, value)`                                                                                                                                                                                                                                             | your logger, e.g. `(key, value) => console.log(name, key, value)` |

## Options of `new SteamBadgeUnlocker(community, options)`

| Option      | Default                        | What it does                                  |
|-------------|--------------------------------|-----------------------------------------------|
| `apiKey`    | read from the account          | Web API key for the quest progress            |
| `apiToken`  | read from the points shop page | store `webapi_token` for SetProfileBackground |
| `customUrl` | read by `start()`              | custom profile URL name                       |

Where these values come from: [data sources](data-sources.md).
