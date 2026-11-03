const [accountsFile, limit] = process.argv.slice(2);

if (!accountsFile) {
	console.error('Usage: node run-community-leader.js <accounts.csv> [number of accounts]');
	console.error('CSV header: username,password,shared_secret (more columns are ignored).');
	console.error('The first account is the master: the friend of all other accounts; it runs no quests itself.');
	console.error('Optional: YT_ACCESS_TOKEN=<youtube_accesstoken cookie> for PostVideo.');
	process.exit(1);
}

const SteamBadgeUnlocker = require('steam-badge-unlocker');
const {readAccounts, TokenStore, login} = require('./utils/login-accounts');

const SECONDS_BETWEEN_LOGINS = 10;
const delay = seconds => new Promise(resolve => setTimeout(resolve, seconds * 1000));
const log = (accountName, key, value) => console.log(new Date().toISOString(), accountName, key, value);

const sessions = [];

async function run() {
	const accounts = readAccounts(accountsFile).slice(0, limit ? Number(limit) : undefined);
	const tokens = new TokenStore(accountsFile);
	const master = await login(accounts[0], tokens);
	sessions.push(master);
	const youtubeCookies = {accessToken: process.env.YT_ACCESS_TOKEN || null};

	for (const account of accounts.slice(1)) {
		await delay(SECONDS_BETWEEN_LOGINS);
		const bot = await login(account, tokens).catch((error) => {
			log(account.username, 'login', error.message);
			return null;
		});
		if (!bot) {
			continue;
		}
		sessions.push(bot);
		const leader = new SteamBadgeUnlocker(bot.community).createCommunityLeader({
			masterInstance: master.community,
			steamUser: bot.user,
			forceAddFriend: true,
			forceRemoveFriend: true,
			youtubeCookies,
			log: (key, value) => log(account.username, key, value),
		});
		await leader.start().catch(error => log(account.username, 'start', error.message));
		await leader.finish();
		bot.user.logOff();
	}
	master.user.logOff();
}

run().catch((error) => {
	console.error(error);
	process.exitCode = 1;
	sessions.forEach(session => session.user.logOff());
});
