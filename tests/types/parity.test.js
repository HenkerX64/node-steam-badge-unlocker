const assert = require('assert');
const {describe, it} = require('node:test');
const fs = require('fs');
const path = require('path');
const {createDeclarationModel} = require('./declarations');
const SteamBadgeUnlocker = require('../../index');
const SteamCommunityMock = require('../mocks/SteamCommunityMock');
const Helpers = require('../../components/helpers');
const DefaultOptions = require('../../resources/OCommunityLeaderDefault');

const root = path.join(__dirname, '..', '..');
const model = createDeclarationModel(root);
const badgeUnlocker = new SteamBadgeUnlocker(new SteamCommunityMock());
const leader = badgeUnlocker.createCommunityLeader({});

/**
 * @param {Array<Object>} sources
 * @returns {Array<string>}
 */
function publicNames(sources) {
	const names = new Set();
	sources.forEach(source => Object.getOwnPropertyNames(source)
		.filter(name => name !== 'constructor' && !name.startsWith('_'))
		.forEach(name => names.add(name)));
	return [...names].sort();
}

/**
 * @returns {Array<string>} the runtime modules the package loads, relative to the package root
 */
function packageModules() {
	return Object.keys(require.cache)
		.map(file => path.relative(root, file).split(path.sep).join('/'))
		.filter(file => file === 'index.js' || /^(classes|components|resources)\/[^/]+\.js$/.test(file))
		.sort();
}

/**
 * @param {string} file
 * @returns {Array<string>} the members the module assigns to SteamBadgeUnlocker.prototype, internal ones included
 */
function prototypeMethods(file) {
	const source = fs.readFileSync(path.join(root, file), 'utf8');
	const pattern = /^\s*SteamBadgeUnlocker\.prototype\.(\w+)\s*=/gm;
	const names = [];
	let match;
	while ((match = pattern.exec(source))) {
		names.push(match[1]);
	}
	return names.sort();
}

/**
 * @param {string} file
 * @returns {boolean}
 */
function hasDeclarations(file) {
	return fs.existsSync(path.join(root, file.replace(/\.js$/, '.d.ts')));
}

describe('type declarations', () => {
	it('declares exactly the members of a SteamBadgeUnlocker instance', () => {
		assert.deepStrictEqual(model.instanceMembers(), publicNames([badgeUnlocker, SteamBadgeUnlocker.prototype]));
	});

	it('declares exactly the static members of SteamBadgeUnlocker', () => {
		const declared = model.staticExports();
		assert.ok(declared.includes('default'));
		assert.deepStrictEqual(declared.filter(name => name !== 'default'), Object.keys(SteamBadgeUnlocker).filter(name => name !== 'default').sort());
		assert.strictEqual(SteamBadgeUnlocker.default, SteamBadgeUnlocker);
	});

	it('declares exactly the members of a CCommunityLeader', () => {
		assert.deepStrictEqual(model.interfaceMembers('CCommunityLeader'), publicNames([leader, Object.getPrototypeOf(leader)]));
	});

	it('declares exactly the default options of a CCommunityLeader', () => {
		assert.deepStrictEqual(model.interfaceMembers('CommunityLeaderOptions'), Object.keys(DefaultOptions).sort());
	});

	it('components/helpers.d.ts declares exactly the exports of components/helpers.js', () => {
		assert.deepStrictEqual(model.moduleExports('components/helpers'), Object.keys(Helpers).sort());
	});

	it('resources/E*.d.ts declare exactly the keys and values of their enums', () => {
		const enumModules = packageModules().filter(file => /^resources\/E\w+\.js$/.test(file));
		assert.ok(enumModules.length > 0);
		enumModules.forEach((file) => {
			const relPath = file.replace(/\.js$/, '');
			assert.deepStrictEqual(model.enumValues(relPath), Object.assign({}, require(path.join(root, file))), relPath);
		});
	});

	it('every module the package loads has a d.ts next to it when it exports something, and only then or when it adds prototype methods', () => {
		const modules = packageModules();
		const exporting = modules.filter((file) => {
			const exported = require(path.join(root, file));
			return typeof exported === 'function' || Object.keys(exported).length > 0;
		});
		const declared = modules.filter(hasDeclarations);
		assert.deepStrictEqual(exporting.filter(file => !declared.includes(file)), []);
		assert.deepStrictEqual(declared.filter(file => !exporting.includes(file) && prototypeMethods(file).length === 0), []);
	});

	it('each *Methods interface declares exactly the prototype methods its component adds', () => {
		const split = packageModules().filter(file => prototypeMethods(file).length > 0 && hasDeclarations(file));
		split.forEach((file) => {
			assert.deepStrictEqual(model.methodsInterfaceMembers(file.replace(/\.js$/, '')), prototypeMethods(file), file);
		});
	});

	it('every module that adds prototype methods has a *Methods declaration next to it', () => {
		const patching = packageModules().filter(file => prototypeMethods(file).length > 0);
		assert.ok(patching.length > 0);
		assert.deepStrictEqual(patching.filter(file => model.methodsInterfaceMembers(file.replace(/\.js$/, '')) === null), []);
	});

	it('the runtime JS declares no own @typedef', () => {
		const withTypedef = packageModules().filter(file => /@typedef\b/.test(fs.readFileSync(path.join(root, file), 'utf8')));
		assert.deepStrictEqual(withTypedef, []);
	});

	it('package.json points to index.d.ts and publishes it', () => {
		const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
		assert.strictEqual(packageJson.types, 'index.d.ts');
		assert.ok(packageJson.files.includes('index.d.ts'));
	});
});
