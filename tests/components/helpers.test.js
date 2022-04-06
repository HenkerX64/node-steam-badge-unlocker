const Helpers = require('../../components/helpers');
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

	const file1 = "\n"
		+ `${validUser}1;${validPass};\n`
		+ `us;${validPass};\n`
		+ `${validUser};pw;\n`
		+ `${validUser}2;${validPass};JXVzZXJ+O3Bhc3N3b3JkOyU/XA==\n`
		+ `${validUser}3;${validPass};;76000000000000000;master\n`;
	const users = Helpers.parseConfigString(file1);
	assert.ok(3, users.length);
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
