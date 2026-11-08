# How to use it with quer/the-steam-awards

This guide runs the quests as a module of [quer/the-steam-awards](https://github.com/quer/the-steam-awards).
That project logs in its accounts one after another and runs its modules for each of them; the module adds
the quests, with the accounts the project already logs in.

1. In the the-steam-awards project, install the packages:

   ```bash
   npm install steam-badge-unlocker steamcommunity
   ```

2. Copy [`examples/the-steam-awards-module.js`](../../examples/the-steam-awards-module.js) (also in
   `node_modules/steam-badge-unlocker/examples/`) to `modules/CommunityBadge.js`.
3. Add `modules.push('CommunityBadge');` to `main.js`.
4. Make sure the first account of its account list can be the master: a full account whose newest
   screenshot is public, see [requirements](../reference/requirements.md#the-master). The module makes the
   first account the master and runs the quests for every following account with it.
5. With many accounts, pace the logins: set `RunningMode.DelayBetweenAccountModes` in its `lib/Settings.js`
   (milliseconds, e.g. `10000`). The core logs the next account in right away otherwise.
6. Start the-steam-awards as usual.

The module uses the core's web cookies (`options.webCookie`) for `steamcommunity` and its client as
`steamUser`, so PlayGame and UseEmoticonInChat run. It expects the core's default RunningMode Single: one
account after another in one process. The run log goes to the core's log, objects as JSON. When Steam answers
with its Access Denied page (`ACCESS_DENIED`), the module logs the blocked request and skips every following
account of the run: [How to react to 429 or a blocked IP](handle-429-or-a-blocked-ip.md).

## Turn on PostVideo

PostVideo is off in the module. To turn it on, add `youtubeCookies` to its `createCommunityLeader` options:

```javascript
const unlocker = new SteamBadgeUnlocker(community);
const leader = unlocker.createCommunityLeader({
	masterInstance: masterCommunity,
	steamUser: steamClient,
	forceAddFriend: true,
	forceRemoveFriend: true,
	youtubeCookies: {accessToken: '<value>'},
	log: (...values) => options.log(...values.map(toText)),
});
```

Where the value comes from: [How to get the YouTube cookie](get-the-youtube-cookie.md).
