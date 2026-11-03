const fs = require('fs');
const SteamUser = require('steam-user');
const SteamCommunity = require('steamcommunity');
const SteamTotp = require('steam-totp');

/**
 * Reads a CSV file whose first line names the columns, e.g.
 * `username,password,shared_secret,identity_secret,steam64_id,steam_partner_id`. Rows without any value are skipped.
 * @param {string} file
 * @param {string} [separator]
 * @returns {Array<Object<string, string>>}
 */
function readAccounts(file, separator = ',') {
	const [header, ...rows] = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(line => line.trim() !== '');
	const columns = header.split(separator).map(column => column.trim());
	return rows.map((row) => {
		const values = row.split(separator);
		/** @type {Object<string, string>} */
		const account = {};
		columns.forEach((column, i) => account[column] = (values[i] || '').trim());
		return account;
	}).filter(account => Object.values(account).some(value => value !== ''));
}

/**
 * Refresh tokens per account name, kept in `<accounts file>.tokens.json`.
 * @param {string} accountsFile
 */
function TokenStore(accountsFile) {
	const file = accountsFile + '.tokens.json';
	const tokens = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
	const save = () => {
		fs.writeFileSync(file + '.tmp', JSON.stringify(tokens, null, 2), {mode: 0o600});
		fs.renameSync(file + '.tmp', file);
	};

	/**
	 * @param {string} accountName
	 * @returns {string|null} a token that is valid for at least one more hour
	 */
	this.get = (accountName) => {
		const token = tokens[accountName];
		if (!token) {
			return null;
		}
		try {
			const payload = JSON.parse(Buffer.from(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
			return payload.exp > Date.now() / 1000 + 3600 ? token : null;
		} catch (error) {
			return null;
		}
	};
	this.set = (accountName, token) => {
		tokens[accountName] = token;
		save();
	};
}

/**
 * Logs in with a saved refresh token, or with password and shared secret, and resolves once
 * `steamcommunity` has a web session.
 * @param {Object<string, string>} account
 * @param {TokenStore} tokens
 * @returns {Promise<{user: SteamUser, community: SteamCommunity}>}
 */
function login(account, tokens) {
	const refreshToken = tokens.get(account.username);
	return new Promise((resolve, reject) => {
		const user = new SteamUser({renewRefreshTokens: true});
		const community = new SteamCommunity();
		const failLogin = error => reject(new Error(account.username + ': ' + error.message));
		user.on('refreshToken', token => tokens.set(account.username, token));
		user.on('steamGuard', (domain, callback, lastCodeWrong) => {
			if (domain || !account.shared_secret || lastCodeWrong) {
				user.logOff();
				reject(new Error(account.username + ': Steam Guard code needed (' + (domain ? 'email' : 'authenticator') + ')'));
				return;
			}
			callback(SteamTotp.generateAuthCode(account.shared_secret));
		});
		user.once('error', failLogin);
		user.once('webSession', (sessionId, cookies) => {
			user.removeListener('error', failLogin);
			user.on('error', error => console.error(account.username + ': ' + error.message));
			community.setCookies(cookies);
			resolve({user, community});
		});
		if (refreshToken) {
			user.logOn({refreshToken});
			return;
		}
		user.logOn({accountName: account.username, password: account.password});
	});
}

module.exports = {readAccounts, TokenStore, login};
