# How to skip or replace a quest

This guide leaves out a quest of the run, changes what it targets, or does it your own way. All changes go
on the leader that `createCommunityLeader` returns, before `start()`.

## Leave out a quest

For the quests that depend on an option, leave the option out:

| To leave out                                                                                        | Leave out                            |
|-----------------------------------------------------------------------------------------------------|--------------------------------------|
| PostVideo                                                                                           | `youtubeCookies`                     |
| PlayGame, UseEmoticonInChat                                                                         | `steamUser`                          |
| AddFriendToFriendsList, PostCommentOnFriendsPage, PostCommentOnFriendsScreenshot, UseEmoticonInChat | `masterInstance` and `friendSteamId` |

For any other quest, replace its method with one that resolves `false`:

```javascript
const unlocker = new SteamBadgeUnlocker(community);
const leader = unlocker.createCommunityLeader(options);
leader.RecommendGame = async () => false;
leader.JoinGroup = async () => false;
await leader.start();
```

The quest then logs `false` and stays open. Quest names: [tasks](../tasks.md).

## Change what a quest targets

Most quests take their target from an option, e.g. `reviewAppId` for RecommendGame, `wishlistAppId` for
AddItemToWishlist or `joinGroupId` for JoinGroup. To review Team Fortress 2 (app 440):

```javascript
const unlocker = new SteamBadgeUnlocker(community);
const leader = unlocker.createCommunityLeader({
	...options,
	reviewAppId: 440,
});
```

Every such option with its default: [options](../reference/options.md#what-the-tasks-use).

## Do a quest your own way

Assign an async function; `start()` calls it with `this` as the leader when the quest is open and its group
conditions hold:

```javascript
leader.PostStatusToFriends = async function () {
	await myOwnStatusPost(this.options.statusText);
	return true;
};
```

- Use `function`, not an arrow function, when you need `this` (`this.options`, `this.log`).
- Resolve `true` for success: `start()` logs `OK`.
- Resolve `false` when there was nothing to do: `start()` logs `false`.
- Throw on failure: `start()` logs the error's `code` or `message`, keeps it in `getLastError()` and goes on
  with the next quest.

`myOwnStatusPost` stands for your code. The group conditions, e.g. full accounts only:
[How it works](../how-it-works.md#what-a-run-does).

## Send your own request

A replacement can send requests in the bot's web session through the `SteamBadgeUnlocker` instance that created
the leader. `get(params)` and `post(params)` take request-style params (`url`, `qs`, `form`, `json`, `headers`),
resolve with the response body and reject with the request error; Steam's `403 Access Denied` page rejects
with `ACCESS_DENIED`. `getSessionId()` gives the `sessionid` that Steam forms expect.

```javascript
const unlocker = new SteamBadgeUnlocker(community);
const leader = unlocker.createCommunityLeader(options);

leader.Trade = async function () {
	const body = await unlocker.post({
		url: myTradeUrl,
		form: {sessionid: unlocker.getSessionId()},
		json: true,
	});
	return body.success === 1;
};
```

`myTradeUrl` and the success check stand for your code. Every method of the instance: [`index.d.ts`](../../index.d.ts).
