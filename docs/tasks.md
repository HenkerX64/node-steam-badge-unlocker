# Community Leader tasks

The 28 tasks of the Steam **Community Leader** badge (badge `2`) in the order of the badge page,
<https://steamcommunity.com/my/badges/2>: Steam's icon and name, the quest name the log and the code use,
its `questid`, how the library does it, what it needs and what stays on the account.

- A lit icon: the library does the task. A grey icon: the task stays with you.
- "Full account": an account that is not limited. A limited account has spent less than 5 USD on Steam.
- "Stays on the account" assumes that the cleanup succeeds; a failed cleanup is not logged.
- Names without a prefix are methods of `SteamBadgeUnlocker`. The options are those of `createCommunityLeader`,
  see [options](reference/options.md).

1. <img src="https://community.akamai.steamstatic.com/public/images/badges/02_community/SetupSteamGuard_off.png" width="32" height="32" alt="not automated"> **Enable Steam Guard on your Steam account** · `SetupSteamGuard` (115)<br>
   Not automated: account security stays with the owner.

2. <img src="https://community.akamai.steamstatic.com/public/images/badges/02_community/AddPhoneToAccount_off.png" width="32" height="32" alt="not automated"> **Add a phone number to your account.** · `AddPhoneToAccount` (128)<br>
   Not automated: account security stays with the owner.

3. <img src="https://community.akamai.steamstatic.com/public/images/badges/02_community/AddTwoFactorToAccount_off.png" width="32" height="32" alt="not automated"> **Use the Steam Mobile App for two-factor authentication** · `AddTwoFactorToAccount` (134)<br>
   Not automated: account security stays with the owner.

4. <img src="https://community.akamai.steamstatic.com/public/images/badges/02_community/ViewBroadcast_on.png" width="32" height="32" alt="automated"> **View a broadcast** · `ViewBroadcast` (133)<br>
   `getBroadcastManifest` for `broadcastWatchId` or a trending broadcast. Needs: a live broadcast. Stays on the
   account: nothing.

5. <img src="https://community.akamai.steamstatic.com/public/images/badges/02_community/UseDiscoveryQueue_on.png" width="32" height="32" alt="automated"> **Use the Store Discovery Queue** · `UseDiscoveryQueue` (132)<br>
   `finishDiscoveryQueue()`: a new discovery queue, every app cleared. Stays on the account: nothing.

6. <img src="https://community.akamai.steamstatic.com/public/images/badges/02_community/AddItemToWishlist_on.png" width="32" height="32" alt="automated"> **Add a game to your wishlist** · `AddItemToWishlist` (108)<br>
   `addToWishlist(wishlistAppId)`, then `removeFromWishlist`. Stays on the account: nothing.

7. <img src="https://community.akamai.steamstatic.com/public/images/badges/02_community/AddFriendToFriendsList_on.png" width="32" height="32" alt="automated"> **Add a friend to your friends list** · `AddFriendToFriendsList` (113)<br>
   The master sends a friend request first, then `steamcommunity.addFriend(friendSteamId)`. Needs: friend; without
   a master the friend has to accept, and a limited account needs a master (it cannot send invites). Stays on the
   account: the friend, unless `forceRemoveFriend`.

8. <img src="https://community.akamai.steamstatic.com/public/images/badges/02_community/PlayGame_on.png" width="32" height="32" alt="automated"> **Play a game** · `PlayGame` (112)<br>
   `steamUser.requestFreeLicense([playAppId])`, `gamesPlayed` for `playSeconds`, then stops; a game that another
   session of the account plays is stopped. Needs: `steamUser`. Stays on the account: the free license.

9. <img src="https://community.akamai.steamstatic.com/public/images/badges/02_community/RecommendGame_on.png" width="32" height="32" alt="automated"> **Review a game** · `RecommendGame` (104)<br>
   `addGameRecommendation(reviewAppId, reviewText)`: a review that is not public, comments off; then
   `deleteGameRecommendation`. Needs: full account; the account may need to own the app. Stays on the account:
   nothing.

10. <img src="https://community.akamai.steamstatic.com/public/images/badges/02_community/PostScreenshot_on.png" width="32" height="32" alt="automated"> **Post a screenshot** · `PostScreenshot` (105)<br>
    `uploadScreenshot(screenshotAppId, …, fs.createReadStream(screenshotPath))`, then `deleteSharedFile(id,
    screenshotAppId, 'screenshots')`. Needs: — (a 1×1 image ships as `resources/empty.png`). Stays on the account:
    nothing.

11. <img src="https://community.akamai.steamstatic.com/public/images/badges/02_community/PostVideo_on.png" width="32" height="32" alt="automated"> **Post a video** · `PostVideo` (106)<br>
    `postYoutubeVideo(youtubeId)` shares a video of the linked YouTube account, then deletes only the video it
    added. Needs: YouTube cookies and a video, see [How to get the YouTube
    cookie](how-to/get-the-youtube-cookie.md). Stays on the account: nothing.

12. <img src="https://community.akamai.steamstatic.com/public/images/badges/02_community/RateWorkshopItem_on.png" width="32" height="32" alt="automated"> **Rate an item on the Workshop** · `RateWorkshopItem` (114)<br>
    `voteSharedFile(workshopFileId)`. Needs: full account without VAC ban. Stays on the account: the vote.

13. <img src="https://community.akamai.steamstatic.com/public/images/badges/02_community/SubscribeToWorkshopItem_on.png" width="32" height="32" alt="automated"> **Subscribe to an item in the Steam Workshop** · `SubscribeToWorkshopItem` (119)<br>
    `subscribeToSharedFile(workshopFileId, workshopAppId)`, then `unsubscribeFromSharedFile`. Stays on the account:
    nothing.

14. <img src="https://community.akamai.steamstatic.com/public/images/badges/02_community/ViewGuideInOverlay_on.png" width="32" height="32" alt="automated"> **View a guide in the Steam Overlay** · `ViewGuideInOverlay` (121)<br>
    `getSharedFileDetails(guideFileId)` with the Steam overlay user agent. Stays on the account: nothing.

15. <img src="https://community.akamai.steamstatic.com/public/images/badges/02_community/SetupCommunityAvatar_on.png" width="32" height="32" alt="automated"> **Set an avatar on your Community profile** · `SetupCommunityAvatar` (110)<br>
    `selectAvatar(avatarAppId, avatarIndex)` selects an official game avatar. Stays on the account: the avatar.

16. <img src="https://community.akamai.steamstatic.com/public/images/badges/02_community/SetupCommunityRealName_on.png" width="32" height="32" alt="automated"> **Set your real name on your Community profile** · `SetupCommunityRealName` (111)<br>
    `setRealName(realName)` (`steamcommunity.editProfile({realName})`), then again with `''` after
    `resetRealNameAfterSeconds` when `resetRealName` (default); both requests send the `Accept-Language` header,
    without which Steam can answer HTTP 429. Stays on the account: nothing.

17. <img src="https://community.akamai.steamstatic.com/public/images/badges/02_community/SetProfileBackground_on.png" width="32" height="32" alt="automated"> **Set a profile background** · `SetProfileBackground` (126)<br>
    `setProfileBackground` with the background dropped by CraftGameBadge, else the first owned one. Needs: a
    profile background. Stays on the account: the background.

18. <img src="https://community.akamai.steamstatic.com/public/images/badges/02_community/JoinGroup_on.png" width="32" height="32" alt="automated"> **Join a group** · `JoinGroup` (101)<br>
    `steamcommunity.joinGroup(joinGroupId)`, then `leaveGroup`. Stays on the account: nothing with
    `leaveGroupAutomatically` (default).

19. <img src="https://community.akamai.steamstatic.com/public/images/badges/02_community/PostCommentOnFriendsPage_on.png" width="32" height="32" alt="automated"> **Comment on a friend's profile** · `PostCommentOnFriendsPage` (103)<br>
    `steamcommunity.postUserComment` on the friend's profile, then `deleteUserComment`. Needs: friend; Steam Guard
    enabled, else `start()` does not run it. Stays on the account: nothing.

20. <img src="https://community.akamai.steamstatic.com/public/images/badges/02_community/RateUpContentInActivityFeed_on.png" width="32" height="32" alt="automated"> **Rate up content in your Activity Feed** · `RateUpContentInActivityFeed` (118)<br>
    `voteSharedFile(friendsScreenshotFileId)` and a vote on a friend post of the activity feed. Needs: friend
    activity, e.g. the friend's screenshot. Stays on the account: the votes.

21. <img src="https://community.akamai.steamstatic.com/public/images/badges/02_community/PostStatusToFriends_on.png" width="32" height="32" alt="automated"> **Post a status to your friends** · `PostStatusToFriends` (117)<br>
    `steamcommunity.postProfileStatus(statusText)`, then `deleteProfileStatus`. Stays on the account: nothing.

22. <img src="https://community.akamai.steamstatic.com/public/images/badges/02_community/PostCommentOnFriendsScreenshot_on.png" width="32" height="32" alt="automated"> **Comment on a friend's screenshot** · `PostCommentOnFriendsScreenshot` (109)<br>
    `postSharedFileComment` on `friendsScreenshotFileId`, then `deleteSharedFileComment`. Needs: full account;
    friend with a public screenshot. Stays on the account: nothing.

23. <img src="https://community.akamai.steamstatic.com/public/images/badges/02_community/CraftGameBadge_on.png" width="32" height="32" alt="automated"> **Craft a game badge** · `CraftGameBadge` (124)<br>
    `craftBadge(appId)` for `craftGameBadgeAppId` or the first badge ready to craft. Needs: one full set of trading
    cards. Stays on the account: the badge and the dropped items; the cards are used up.

24. <img src="https://community.akamai.steamstatic.com/public/images/badges/02_community/FeatureBadgeOnProfile_on.png" width="32" height="32" alt="automated"> **Feature a badge on your profile** · `FeatureBadgeOnProfile` (127)<br>
    `setFavoriteBadge(featureBadgeId)`. Needs: the badge unlocked; badge 2 after 13 completed quests. Stays on the
    account: the featured badge.

25. <img src="https://community.akamai.steamstatic.com/public/images/badges/02_community/UseEmoticonInChat_on.png" width="32" height="32" alt="automated"> **Use a Steam Emoticon in chat** · `UseEmoticonInChat` (125)<br>
    `steamUser.chat.sendFriendMessage(friend, emotionMessageText)`. Needs: friend and `steamUser`. Stays on the
    account: the chat message.

26. <img src="https://community.akamai.steamstatic.com/public/images/badges/02_community/SearchInDiscussions_on.png" width="32" height="32" alt="automated"> **Search the Steam Discussions** · `SearchInDiscussions` (123)<br>
    `discussionsSearch(discussionsKeyword)`. Stays on the account: nothing.

27. <img src="https://community.akamai.steamstatic.com/public/images/badges/02_community/BuyOrSellOnMarket_off.png" width="32" height="32" alt="not automated"> **Try out the Community Market** · `BuyOrSellOnMarket` (120)<br>
    Not automated: against the [Steam Subscriber
    Agreement](https://store.steampowered.com/subscriber_agreement/english/#4).

28. <img src="https://community.akamai.steamstatic.com/public/images/badges/02_community/Trade_off.png" width="32" height="32" alt="not automated"> **Make a trade** · `Trade` (122)<br>
    Not implemented; resolves `false`.

How many tasks a run completes with what you provide: [FAQ](faq.md#how-many-tasks-will-an-account-complete).
What each quest method returns: [results in code](reference/error-codes.md#results-in-code).

## Notes

- **RateUpContentInActivityFeed** resolves `true` even when there was nothing to vote; without a friend Steam
  most likely does not count it.
- **CraftGameBadge** keeps the dropped items for SetProfileBackground, because right after crafting Steam may
  not list the new background as owned yet.
- **Trade** counts for accepting an offer that only gives the account items, also on a limited account.
- **UseEmoticonInChat** needs `steam-user`: the web chat of `steamcommunity` (`chatLogon`) needs an OAuth token
  that Steam no longer issues.
