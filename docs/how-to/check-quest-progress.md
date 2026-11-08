# How to check quest progress

This guide shows which Community Leader quests of an account are done and which are still open.

## From the run log

Each bot's run logs the open quests before and after:

```
- { openQuests: 9 }
…
- { openQuests: 8, solvedQuests: 1 }
```

The last line is what Steam counted after the run. If it follows `error not able to get badge progress`,
the badge page was unreadable, see [FAQ](../faq.md#what-does-a-log-line-say).

## From your code

`community` is a logged-in `steamcommunity` instance:

```javascript
const SteamBadgeUnlocker = require('steam-badge-unlocker');

async function logProgress(community) {
	const unlocker = new SteamBadgeUnlocker(community);
	const progress = await unlocker.getCommunityBadgeProgressFromProfile(2);
	const quests = progress.response.quests || [];

	for (const quest of quests) {
		const name = SteamBadgeUnlocker.ECommunityBadgeQuests[quest.questid];
		console.log(name, quest.completed ? 'done' : 'open');
	}
}
```

`getCommunityBadgeProgressFromProfile` reads the badge page and needs no Web API key. If the account has a
key, `getCommunityBadgeProgress(apiKey, 2)` reads the same through the Web API. Both resolve
`{response: {quests: [{questid, completed}]}}`; `quests` is missing when the badge page showed no quests.

## For every account of an accounts file

Next to `run-community-leader.js`, save this as `check-progress.js`:

```javascript
const SteamBadgeUnlocker = require('steam-badge-unlocker');
const {readAccounts, TokenStore, login} = require('./utils/login-accounts');

const accountsFile = process.argv[2];
const delay = seconds => new Promise(resolve => setTimeout(resolve, seconds * 1000));

async function printOpenQuests(account, community) {
	const unlocker = new SteamBadgeUnlocker(community);
	const progress = await unlocker.getCommunityBadgeProgressFromProfile(2);
	const quests = progress.response.quests || [];
	const open = quests.filter(quest => !quest.completed);

	console.log(account.username, `${quests.length - open.length} of ${quests.length} done`);
	for (const quest of open) {
		console.log('  open:', SteamBadgeUnlocker.ECommunityBadgeQuests[quest.questid]);
	}
}

async function checkAccount(account, tokens) {
	const session = await login(account, tokens);
	try {
		await printOpenQuests(account, session.community);
	} finally {
		session.user.logOff();
	}
}

async function main() {
	const tokens = new TokenStore(accountsFile);
	for (const account of readAccounts(accountsFile)) {
		try {
			await checkAccount(account, tokens);
		} catch (error) {
			console.log(error.message);
		}
		await delay(10);
	}
}

main();
```

Run it with the same accounts file:

```bash
node check-progress.js accounts.csv
```

It logs in every account 10 seconds apart, prints the number of completed quests and the names of the open
ones, and logs off. An account whose badge page shows no quests prints `0 of 0 done`; an account that cannot
log in prints the login error, which starts with the account name. Steam's names and icons of the quests and what each one needs: [tasks](../tasks.md).
