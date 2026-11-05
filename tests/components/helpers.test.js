const fs = require('fs');
const Helpers = require('../../components/helpers');
const SteamCommunity = require('steamcommunity');
const assert = require('assert');

it('isSteamId()', async () => {
	assert.strictEqual(typeof Helpers.isSteamId, 'function');
	assert.ok(!Helpers.isSteamId('1'));
	assert.ok(!Helpers.isSteamId('test'));
	assert.ok(!Helpers.isSteamId('7600000000000000a'));
	assert.ok(!Helpers.isSteamId('76000000000000000a'));
	assert.ok(Helpers.isSteamId('76000000000000000'));
	assert.ok(Helpers.isSteamId(76000000000000000));
});

it('parseConfigString()', async () => {
	assert.ok(typeof Helpers.parseConfigString === 'function');
	assert.ok(0 === Helpers.parseConfigString(null).length);
	const validPass = 'o1234567';
	const validUser = 'user';
	assert.ok(0 === Helpers.parseConfigString(`${validUser};pass;`).length);
	assert.ok(0 === Helpers.parseConfigString(`${validUser};${validPass}`).length);
	assert.ok(1 === Helpers.parseConfigString(`${validUser};${validPass};`).length);
	assert.ok(1 === Helpers.parseConfigString(` ${validUser}; ${validPass};`).length);

	const users = Helpers.parseConfigString(fs.readFileSync(__dirname + '/../fixtures/config/parseconfigstring.txt', 'utf8'));
	assert.strictEqual(3, users.length);
	assert.strictEqual(`${validUser}1`, users[0].accountName);
	assert.strictEqual(`${validPass}`, users[0].password);
	assert.strictEqual(`${validUser}2`, users[1].accountName);
	assert.strictEqual(`${validPass}`, users[1].password);
	assert.strictEqual(`${validUser}3`, users[2].accountName);
	assert.ok(/XA==/.test(users[1].secret));
	assert.ok(2 === users[2].params.length);
	assert.strictEqual('76000000000000000', users[2].params[0]);
	assert.strictEqual('master', users[2].params[1]);
});

it('withRequestOptions() - edits the options of requests started while run is pending, then removes the hook', async () => {
	const community = {};
	const options = {};
	const result = await Helpers.withRequestOptions(community, edited => edited.qs = {l: 'english'}, async () => {
		assert.strictEqual(community.onPreHttpRequest(1, 'steamcommunity', options, () => null), false);
		return 'done';
	});
	assert.strictEqual(result, 'done');
	assert.deepStrictEqual(options, {qs: {l: 'english'}});
	assert.ok(!('onPreHttpRequest' in community));
});

it('withRequestOptions() - passes edited requests to the previous hook and restores it after a failure', async () => {
	const calls = [];
	const community = {
		onPreHttpRequest(requestId, source, options, continueRequest) {
			calls.push({self: this, requestId, source, edited: options.edited, continueRequest});
			return true;
		},
	};
	const previous = community.onPreHttpRequest;
	const continueRequest = () => null;
	const error = await Helpers.withRequestOptions(community, options => options.edited = true, async () => {
		assert.strictEqual(community.onPreHttpRequest(7, 'steamcommunity', {}, continueRequest), true);
		throw new Error('failed');
	}).catch(e => e);
	assert.strictEqual(error.message, 'failed');
	assert.strictEqual(calls.length, 1);
	assert.strictEqual(calls[0].self, community);
	assert.strictEqual(calls[0].requestId, 7);
	assert.strictEqual(calls[0].source, 'steamcommunity');
	assert.strictEqual(calls[0].edited, true);
	assert.strictEqual(calls[0].continueRequest, continueRequest);
	assert.strictEqual(community.onPreHttpRequest, previous);
});

it('withRequestOptions() - overlapping calls that finish in start order edit only while their own run is pending, then restore the hook before them', async () => {
	const hookBefore = () => false;
	const community = {onPreHttpRequest: hookBefore};
	const startRequest = options => community.onPreHttpRequest(1, 'steamcommunity', options, () => null);
	let finishFirst;
	let finishSecond;
	const first = Helpers.withRequestOptions(community, options => options.first = true, () => new Promise(resolve => finishFirst = resolve));
	const second = Helpers.withRequestOptions(community, options => options.second = true, () => new Promise(resolve => finishSecond = resolve));
	finishFirst();
	await first;
	const whileSecondRuns = {};
	startRequest(whileSecondRuns);
	finishSecond();
	await second;
	const afterBoth = {};
	startRequest(afterBoth);
	assert.deepStrictEqual(whileSecondRuns, {second: true});
	assert.deepStrictEqual(afterBoth, {});
	assert.strictEqual(community.onPreHttpRequest, hookBefore);
});

it('withRequestOptions() - overlapping calls that finish in any order remove the hook after the last one', async () => {
	const community = {};
	const finish = [];
	const calls = [0, 1, 2].map(() => Helpers.withRequestOptions(community, () => null, () => new Promise(resolve => finish.push(resolve))));
	finish[1]();
	await calls[1];
	finish[0]();
	await calls[0];
	finish[2]();
	await calls[2];
	assert.ok(!('onPreHttpRequest' in community));
});

it('withRequestOptions() - edits the requests of a steamcommunity instance', async () => {
	const community = new SteamCommunity();
	const sentQueries = [];
	community.request = (options, callback) => {
		sentQueries.push(options.qs);
		callback(null, {statusCode: 200, headers: {}}, '');
	};
	const getEditInfo = () => new Promise(resolve => community.httpRequestGet('https://steamcommunity.com/my/edit/info', () => resolve()));
	await Helpers.withRequestOptions(community, options => options.qs = {l: 'english'}, getEditInfo);
	await getEditInfo();
	assert.deepStrictEqual(sentQueries, [{l: 'english'}, undefined]);
	assert.ok(!('onPreHttpRequest' in community));
});

it('withRequestOptions() - keeps a hook installed while run is pending', async () => {
	const community = {};
	const replacement = () => false;
	await Helpers.withRequestOptions(community, options => options.edited = true, async () => {
		community.onPreHttpRequest = replacement;
	});
	assert.strictEqual(community.onPreHttpRequest, replacement);
});

it('withMissingRequiredHeaders() - adds the headers Steam requires unless the request sets them', async () => {
	const community = {};
	const plain = {};
	const own = {headers: {'Accept-Language': 'de-DE'}};
	await Helpers.withMissingRequiredHeaders(community, async () => {
		community.onPreHttpRequest(1, 'steamcommunity', plain, () => null);
		community.onPreHttpRequest(2, 'steamcommunity', own, () => null);
	});
	assert.deepStrictEqual(plain.headers, {'Accept-Language': 'en-US,en;q=0.9'});
	assert.deepStrictEqual(own.headers, {'Accept-Language': 'de-DE'});
	assert.ok(!('onPreHttpRequest' in community));
});

it('withMissingRequiredHeaders() - keeps a required header the request sets in any letter case and its other headers', async () => {
	const community = {};
	const headers = {'accept-language': 'de-DE', origin: 'https://steamcommunity.com'};
	const lowercase = {headers};
	await Helpers.withMissingRequiredHeaders(community, async () => {
		community.onPreHttpRequest(1, 'steamcommunity', lowercase, () => null);
	});
	assert.deepStrictEqual(lowercase.headers, {'accept-language': 'de-DE', origin: 'https://steamcommunity.com'});
	assert.deepStrictEqual(headers, {'accept-language': 'de-DE', origin: 'https://steamcommunity.com'});
});

it('withMissingRequiredHeaders() - adds a missing required header next to the other headers without changing the caller\'s headers object', async () => {
	const community = {};
	const headers = {origin: 'https://steamcommunity.com'};
	const post = {headers};
	await Helpers.withMissingRequiredHeaders(community, async () => {
		community.onPreHttpRequest(1, 'steamcommunity', post, () => null);
	});
	assert.deepStrictEqual(post.headers, {origin: 'https://steamcommunity.com', 'Accept-Language': 'en-US,en;q=0.9'});
	assert.deepStrictEqual(headers, {origin: 'https://steamcommunity.com'});
});

it('getAccessDeniedError() - an Akamai 403 page becomes ACCESS_DENIED with the reference, the url without query and the method', () => {
	const page = fs.readFileSync(__dirname + '/../fixtures/pages/akamai-access-denied.html', 'utf8');
	const error = Helpers.getAccessDeniedError({statusCode: 403, headers: {server: 'AkamaiGHost'}}, page, {uri: 'https://steamcommunity.com/market/?l=english'});
	assert.deepStrictEqual(
		{code: error.code, message: error.message, statusCode: error.statusCode, reference: error.reference, url: error.url, method: error.method},
		{code: 'ACCESS_DENIED', message: 'ACCESS_DENIED', statusCode: 403, reference: '18.202c1102.1793901546.74e95e7', url: 'https://steamcommunity.com/market/', method: 'GET'},
	);
	assert.strictEqual(Helpers.getAccessDeniedError({statusCode: 403, headers: {}}, page, {url: 'https://store.steampowered.com/', method: 'post'}).method, 'POST');
});

it('getAccessDeniedError() - other responses are no Akamai block', () => {
	const familyView = '<div id="parental_notice_instructions">Enter your PIN below to exit Family View.</div>';
	assert.strictEqual(Helpers.getAccessDeniedError({statusCode: 403, headers: {}}, familyView), null);
	assert.strictEqual(Helpers.getAccessDeniedError({statusCode: 429, headers: {server: 'AkamaiGHost'}}, ''), null);
	assert.strictEqual(Helpers.getAccessDeniedError({statusCode: 200, headers: {server: 'AkamaiGHost'}}, ''), null);
	assert.strictEqual(Helpers.getAccessDeniedError(undefined, undefined), null);
});
