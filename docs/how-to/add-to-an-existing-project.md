# How to add it to an existing project with steamcommunity

This guide adds the badge tasks to a project that already logs its accounts in with `steamcommunity`, with or
without `steam-user`.

## Install

```bash
npm install steam-badge-unlocker
```

The package uses the `steamcommunity` of your project (`>=3.43.1`) and the `steam-user` client you pass in (`>=5.0.0`);
it installs neither.

## Run the quests for each bot

Pick one logged-in account as the master and run every other account as a bot. `masterCommunity` and each
`bot.community` are logged-in `steamcommunity` instances:

```javascript
const SteamBadgeUnlocker = require('steam-badge-unlocker');

async function runQuests(masterCommunity, bots) {
	for (const bot of bots) {
		const unlocker = new SteamBadgeUnlocker(bot.community);
		const leader = unlocker.createCommunityLeader({
			masterInstance: masterCommunity,
			steamUser: bot.user,
			forceAddFriend: true,
			forceRemoveFriend: true,
		});

		try {
			await leader.start();
		} catch (error) {
			console.error(error);
		}
		await leader.finish();
	}
}
```

- `masterInstance` is the master's logged-in `steamcommunity` instance. One instance serves all leaders. The
  master must be a full account with a public newest screenshot, see
  [requirements](../reference/requirements.md#the-master).
- `forceAddFriend: true` makes the bot add the master before the other friend quests, even when its
  AddFriendToFriendsList quest is done already, as long as any quest is open. The other friend quests need the
  friendship.
- `forceRemoveFriend: true` makes `finish()` remove the friend again: the master, or `friendSteamId` when you
  name a friend yourself, also one the bot had before.
- If your project does not run `steam-user`, leave `steamUser` out: PlayGame and UseEmoticonInChat are then
  skipped.
- To log through your own logger, pass `log: (key, value) => …`.

Put your own steps for the bot between `start()` and `finish()`, while the master is still its friend.

## Keep the sessions right

- Create each `SteamBadgeUnlocker` after `community.setCookies(cookies)`: the constructor reads the SteamID
  and session id once. After a new login, create a new one.
- Give every account its own `steamcommunity` instance; only the master instance is shared.
- If quests log `Not Logged In`, the web session has expired: log the account in again and create a new
  `SteamBadgeUnlocker`.

## If your project has no login yet

`steam-user` keeps the session alive and hands web cookies to `steamcommunity`. The minimum per account,
with `details` as `{accountName, password, twoFactorCode}` or `{refreshToken}`:

```javascript
const SteamUser = require('steam-user');
const SteamCommunity = require('steamcommunity');

function logIn(details) {
	return new Promise((resolve, reject) => {
		const user = new SteamUser();
		user.once('error', reject);
		user.once('webSession', (sessionId, cookies) => {
			const community = new SteamCommunity();
			community.setCookies(cookies);
			user.removeListener('error', reject);
			user.on('error', error => console.error(error.message));
			resolve({community, user});
		});
		user.logOn(details);
	});
}
```

Log each bot off with `user.logOff()` when its tasks are done. The master only has to stay logged in while
bots run; if your project also trades with it or listens to its events, keep its session open after the run.
`steamcommunity.login()` works as well, but then there is no `steam-user` client, and PlayGame and
UseEmoticonInChat are skipped. A complete login with stored refresh
tokens is in [`examples/utils/login-accounts.js`](../../examples/utils/login-accounts.js).

## Handle a blocked IP

`start()` rejects with `ACCESS_DENIED` when Steam blocks web requests from your IP; the next bots would fail
the same way. Stop the loop on it, with the options from above:

```javascript
for (const bot of bots) {
	const unlocker = new SteamBadgeUnlocker(bot.community);
	const leader = unlocker.createCommunityLeader(options);

	try {
		await leader.start();
	} catch (error) {
		if (error.code === SteamBadgeUnlocker.EErrorCode.ACCESS_DENIED) {
			console.error('Steam blocks web requests from this IP:', error.method, error.url, error.reference);
			break;
		}
		console.error(error);
	}
	await leader.finish();
}
```

More: [How to react to 429 or a blocked IP](handle-429-or-a-blocked-ip.md). Every option with its default:
[options](../reference/options.md).
