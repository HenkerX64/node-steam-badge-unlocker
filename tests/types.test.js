const SteamBadgeUnlocker = require('../index');
const SteamCommunityMock = require('./mocks/SteamCommunityMock');
const Helpers = require('../components/helpers');
const DefaultOptions = require('../resources/OCommunityLeaderDefault');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const badgeUnlocker = new SteamBadgeUnlocker(new SteamCommunityMock());
const leader = badgeUnlocker.createCommunityLeader({});

/**
 * @param {string} file
 * @returns {string}
 */
function readDeclarations(file) {
	return fs.readFileSync(path.join(root, file), 'utf8');
}

/**
 * @param {string} declarations
 * @param {string} opening
 * @param {string} closing
 * @returns {string}
 */
function declarationBlock(declarations, opening, closing) {
	const start = declarations.indexOf(opening);
	assert.ok(start >= 0, `missing ${opening}`);
	return declarations.slice(start + opening.length, declarations.indexOf(closing, start));
}

/**
 * @param {string} block
 * @param {string} indent
 * @returns {Array<string>}
 */
function declaredNames(block, indent) {
	const pattern = new RegExp(`^${indent}(?:readonly |export function |export const )?'?([\\w]*)'?\\??\\s*[(:<]`, 'gm');
	const names = [];
	let match;
	while ((match = pattern.exec(block))) {
		names.push(match[1]);
	}
	return names.filter(name => name !== 'constructor').sort();
}

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

it('index.d.ts declares exactly the members of a SteamBadgeUnlocker instance', () => {
	const block = declarationBlock(readDeclarations('index.d.ts'), 'declare class SteamBadgeUnlocker<', '\n}');
	assert.deepStrictEqual(declaredNames(block, '\t'), publicNames([badgeUnlocker, SteamBadgeUnlocker.prototype]));
});

it('index.d.ts declares exactly the static members of SteamBadgeUnlocker', () => {
	const block = declarationBlock(readDeclarations('index.d.ts'), 'declare namespace SteamBadgeUnlocker {', '\n}');
	const declaredConstants = (block.match(/^\texport const \w+:/gm) || []).map(line => line.slice('\texport const '.length, -1)).sort();
	assert.deepStrictEqual(declaredConstants, Object.keys(SteamBadgeUnlocker).filter(name => name !== 'default').sort());
	assert.ok(block.includes('\n\texport {SteamBadgeUnlocker as default};'));
	assert.strictEqual(SteamBadgeUnlocker.default, SteamBadgeUnlocker);
});

it('index.d.ts declares exactly the members of a CCommunityLeader', () => {
	const block = declarationBlock(readDeclarations('index.d.ts'), 'export interface CCommunityLeader {', '\n\t}');
	assert.deepStrictEqual(declaredNames(block, '\t\t'), publicNames([leader, Object.getPrototypeOf(leader)]));
});

it('index.d.ts declares exactly the default options of a CCommunityLeader', () => {
	const block = declarationBlock(readDeclarations('index.d.ts'), 'export interface CommunityLeaderOptions {', '\n\t}');
	assert.deepStrictEqual(declaredNames(block, '\t\t'), Object.keys(DefaultOptions).sort());
});

it('components/helpers.d.ts declares exactly the exports of components/helpers.js', () => {
	assert.deepStrictEqual(declaredNames(readDeclarations('components/helpers.d.ts'), ''), Object.keys(Helpers).sort());
});

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
 * @param {string} block
 * @returns {Object<string, string|number>}
 */
function declaredEnum(block) {
	const values = {};
	const pattern = /^\treadonly '?(\w*)'?: (?:'([^']*)'|(\d+));/gm;
	let match;
	while ((match = pattern.exec(block))) {
		values[match[1]] = match[2] === undefined ? Number(match[3]) : match[2];
	}
	return values;
}

it('resources/E*.d.ts declare exactly the keys and values of their enums', () => {
	const enumModules = packageModules().filter(file => /^resources\/E\w+\.js$/.test(file));
	assert.ok(enumModules.length > 0);
	enumModules.forEach((file) => {
		const name = path.basename(file, '.js');
		const block = declarationBlock(readDeclarations(`resources/${name}.d.ts`), `declare const ${name}: {`, '\n};');
		assert.deepStrictEqual(declaredEnum(block), Object.assign({}, require(path.join(root, file))), name);
	});
});

it('every module the package loads has a d.ts next to it exactly when it exports something', () => {
	const modules = packageModules();
	const exporting = modules.filter((file) => {
		const exported = require(path.join(root, file));
		return typeof exported === 'function' || Object.keys(exported).length > 0;
	});
	const declared = modules.filter(file => fs.existsSync(path.join(root, file.replace(/\.js$/, '.d.ts'))));
	assert.deepStrictEqual(declared, exporting);
});

it('package.json points to index.d.ts and publishes it', () => {
	const packageJson = JSON.parse(readDeclarations('package.json'));
	assert.strictEqual(packageJson.types, 'index.d.ts');
	assert.ok(packageJson.files.includes('index.d.ts'));
});
