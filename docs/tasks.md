# Community Leader quests

Every quest of the Steam **Community Leader** badge (badge id `2`), how `steam-badge-unlocker` solves it,
what it needs and what it leaves on the account. Setup and options: [getting started](getting-started.md).
"Stays on the account" assumes the cleanup succeeds; a failed cleanup is not logged.

The badge has three levels, counted by completed quests: Pillar of Community 13+, Community Ambassador 21+,
Community Leader 27+. "Full account" means an account that is not limited (limited: less than 5 USD spent
on Steam).

## Quests

| Id | Quest | How | Needs | Stays on the account |
|---|---|---|---|---|
| 101 | JoinGroup | `steamcommunity.joinGroup(joinGroupId)`, then `leaveGroup` | — | nothing with `leaveGroupAutomatically` (default) |
| 103 | PostCommentOnFriendsPage | `steamcommunity.postUserComment` on the friend's profile, then `deleteUserComment` | friend; Steam Guard enabled, else `start()` does not run it | nothing |
| 104 | RecommendGame | `addGameRecommendation(reviewAppId, reviewText)`: a review that is not public, comments off; then `deleteGameRecommendation` | full account; the account may need to own the app | nothing |
| 105 | PostScreenshot | `uploadScreenshot(screenshotAppId, …, fs.createReadStream(screenshotPath))`, then `deleteSharedFile(id, screenshotAppId, 'screenshots')` | — (a 1×1 image ships as `resources/empty.png`) | nothing |
| 106 | PostVideo | `postYoutubeVideo(youtubeId)` shares a video of the linked YouTube account, then deletes only the video it added | YouTube cookies and a video, see [getting started](getting-started.md#youtube-cookies-for-postvideo) | nothing |
| 108 | AddItemToWishlist | `addToWishlist(wishlistAppId)`, then `removeFromWishlist` | — | nothing |
| 109 | PostCommentOnFriendsScreenshot | `postSharedFileComment` on `friendsScreenshotFileId`, then `deleteSharedFileComment` | full account; friend with a public screenshot | nothing |
| 110 | SetupCommunityAvatar | `selectAvatar(avatarAppId, avatarIndex)` selects an official game avatar | — | the avatar |
| 111 | SetupCommunityRealName | `setRealName(realName)` (`steamcommunity.editProfile({realName})`), then again with `''` after `resetRealNameAfterSeconds` when `resetRealName` (default); both requests send the `Accept-Language` header, without which Steam can answer HTTP 429 | — | nothing |
| 112 | PlayGame | `steamUser.requestFreeLicense([playAppId])`, `gamesPlayed` for `playSeconds`, then stops; a game that another session of the account plays is stopped | `steamUser` | the free license |
| 113 | AddFriendToFriendsList | the master sends a friend request first, then `steamcommunity.addFriend(friendSteamId)` | friend; without a master the friend has to accept, and a limited account needs a master (it cannot send invites) | the friend, unless `forceRemoveFriend` |
| 114 | RateWorkshopItem | `voteSharedFile(workshopFileId)` | full account without VAC ban | the vote |
| 115 | SetupSteamGuard | not automated: account security stays with the owner | — | — |
| 117 | PostStatusToFriends | `steamcommunity.postProfileStatus(statusText)`, then `deleteProfileStatus` | — | nothing |
| 118 | RateUpContentInActivityFeed | `voteSharedFile(friendsScreenshotFileId)` and a vote on a friend post of the activity feed | friend activity, e.g. the friend's screenshot | the votes |
| 119 | SubscribeToWorkshopItem | `subscribeToSharedFile(workshopFileId, workshopAppId)`, then `unsubscribeFromSharedFile` | — | nothing |
| 120 | BuyOrSellOnMarket | not automated: against the [Steam Subscriber Agreement](https://store.steampowered.com/subscriber_agreement/english/#4) | — | — |
| 121 | ViewGuideInOverlay | `getSharedFileDetails(guideFileId)` with the Steam overlay user agent | — | nothing |
| 122 | Trade | not implemented; resolves `false` | — | — |
| 123 | SearchInDiscussions | `discussionsSearch(discussionsKeyword)` | — | nothing |
| 124 | CraftGameBadge | `craftBadge(appId)` for `craftGameBadgeAppId` or the first badge ready to craft | one full set of trading cards | the badge and the dropped items; the cards are used up |
| 125 | UseEmoticonInChat | `steamUser.chat.sendFriendMessage(friend, emotionMessageText)` | friend and `steamUser` | the chat message |
| 126 | SetProfileBackground | `setProfileBackground` with the background dropped by CraftGameBadge, else the first owned one | a profile background | the background |
| 127 | FeatureBadgeOnProfile | `setFavoriteBadge(featureBadgeId)` | the badge unlocked; badge 2 after 13 completed quests | the featured badge |
| 128 | AddPhoneToAccount | not automated: account security stays with the owner | — | — |
| 132 | UseDiscoveryQueue | `finishDiscoveryQueue()`: a new discovery queue, every app cleared | — | nothing |
| 133 | ViewBroadcast | `getBroadcastManifest` for `broadcastWatchId` or a trending broadcast | a live broadcast | nothing |
| 134 | AddTwoFactorToAccount | not automated: account security stays with the owner | — | — |

Names without a prefix are methods of `SteamBadgeUnlocker`; the options are those of
`createCommunityLeader`. Every automated quest method resolves `true` when its requests succeeded and
`false` when it did not succeed; `getLastError()` holds the error when there was one. BuyOrSellOnMarket and
the three security quests resolve `null`.

## Notes

- **RateUpContentInActivityFeed** resolves `true` even when there was nothing to vote; without a friend Steam
  most likely does not count it.
- **CraftGameBadge** keeps the dropped items for SetProfileBackground, because right after crafting Steam may
  not list the new background as owned yet.
- **UseEmoticonInChat** needs `steam-user`: the web chat of `steamcommunity` (`chatLogon`) needs an OAuth token
  that Steam no longer issues.
