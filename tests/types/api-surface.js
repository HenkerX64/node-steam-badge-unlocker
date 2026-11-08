const fs = require('fs');
const path = require('path');
const {createDeclarationModel} = require('./declarations');

const ROOT = path.join(__dirname, '..', '..');
const SNAPSHOT_FILE = path.join(__dirname, 'api-surface.txt');

/**
 * @param {string} text
 * @returns {string}
 */
function escapeRegExp(text) {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * @param {string} text
 * @param {Array<[string, string]>} aliases
 * @returns {string}
 */
function canonicalizeAliases(text, aliases) {
	return aliases.reduce((result, [from, to]) => result.replace(new RegExp(`\\b${escapeRegExp(from)}\\b`, 'g'), to), text);
}

/**
 * @param {string} root
 * @returns {string}
 */
function printApiSurface(root) {
	const model = createDeclarationModel(root);
	const {ts, checker, entry, unlocker, typeOf} = model;
	const flags = ts.NodeBuilderFlags.NoTruncation | ts.NodeBuilderFlags.UseFullyQualifiedType | ts.NodeBuilderFlags.IgnoreErrors;
	const printer = ts.createPrinter({removeComments: true});
	const text = node => printer.printNode(ts.EmitHint.Unspecified, node, entry);
	const sortUnions = (node) => {
		const visited = ts.visitEachChild(node, sortUnions, ts.nullTransformationContext);
		if (!ts.isUnionTypeNode(visited)) {
			return visited;
		}
		const types = visited.types.slice().sort((a, b) => (text(a) < text(b) ? -1 : 1));
		return ts.factory.updateUnionTypeNode(visited, ts.factory.createNodeArray(types));
	};
	const print = (type, extraFlags = 0) => text(sortUnions(checker.typeToTypeNode(type, undefined, flags | extraFlags)));
	const printSignature = (signature, kind) => text(sortUnions(checker.signatureToSignatureDeclaration(signature, kind, undefined, flags)));
	const optional = symbol => ((symbol.flags & ts.SymbolFlags.Optional) ? '?' : '');
	const byName = (a, b) => (a.name < b.name ? -1 : 1);
	const isPublic = symbol => symbol.name !== 'prototype' && !symbol.name.startsWith('_');
	const lines = [];

	const classDeclaration = unlocker.declarations.find(ts.isClassDeclaration);
	lines.push(`class SteamBadgeUnlocker<${classDeclaration.typeParameters.map(parameter => parameter.getText()).join(', ')}>`);
	model.staticType().getConstructSignatures()
		.forEach(signature => lines.push(printSignature(signature, ts.SyntaxKind.ConstructorType)));
	checker.getPropertiesOfType(model.instanceType()).filter(isPublic).sort(byName)
		.forEach(member => lines.push(`member ${member.name}${optional(member)}: ${print(typeOf(member))}`));
	checker.getPropertiesOfType(model.staticType()).filter(isPublic).sort(byName)
		.forEach(member => lines.push(`static ${member.name}: ${print(typeOf(member))}`));

	const printInterface = (prefix, symbol) => {
		const type = checker.getDeclaredTypeOfSymbol(symbol);
		checker.getPropertiesOfType(type).sort(byName)
			.forEach(property => lines.push(`${prefix}interface ${symbol.name}.${property.name}${optional(property)}: ${print(typeOf(property))}`));
		checker.getIndexInfosOfType(type)
			.forEach(info => lines.push(`${prefix}interface ${symbol.name}[${print(info.keyType)}]: ${print(info.type)}`));
		type.getCallSignatures()
			.forEach(signature => lines.push(`${prefix}interface ${symbol.name}(): ${printSignature(signature, ts.SyntaxKind.FunctionType)}`));
	};

	const aliases = [];
	model.namespaceTypes().forEach((symbol) => {
		if (symbol.flags & ts.SymbolFlags.TypeAlias) {
			const declaration = symbol.declarations.find(ts.isTypeAliasDeclaration);
			if (ts.isTypeReferenceNode(declaration.type) && !declaration.type.typeArguments) {
				aliases.push([declaration.type.typeName.getText(), `SteamBadgeUnlocker.${symbol.name}`]);
			}
			lines.push(`type ${symbol.name} = ${print(checker.getDeclaredTypeOfSymbol(symbol), ts.NodeBuilderFlags.InTypeAlias)}`);
		}
		if (symbol.flags & ts.SymbolFlags.Interface) {
			printInterface('', symbol);
		}
	});

	const helpers = model.moduleSymbol('components/helpers');
	checker.getExportsOfModule(helpers).sort(byName).forEach((symbol) => {
		if (symbol.flags & ts.SymbolFlags.Value) {
			lines.push(`module components/helpers ${symbol.name}: ${print(typeOf(symbol))}`);
		}
		if (symbol.flags & ts.SymbolFlags.TypeAlias) {
			lines.push(`module components/helpers type ${symbol.name} = ${print(checker.getDeclaredTypeOfSymbol(symbol), ts.NodeBuilderFlags.InTypeAlias)}`);
		}
		if (symbol.flags & ts.SymbolFlags.Interface) {
			printInterface('module components/helpers ', symbol);
		}
	});

	fs.readdirSync(path.join(root, 'resources')).filter(file => file.endsWith('.d.ts')).sort().forEach((file) => {
		const relPath = `resources/${file.slice(0, -'.d.ts'.length)}`;
		lines.push(`module ${relPath}: ${print(typeOf(checker.resolveExternalModuleSymbol(model.moduleSymbol(relPath))))}`);
	});

	const moduleNames = model.entryImports().map(([name, relPath]) => [`import("${path.join(root, relPath)}")`, name]);
	const named = moduleNames.reduce((result, [specifier, name]) => result.split(specifier).join(name), `${lines.join('\n')}\n`);
	const surface = canonicalizeAliases(named, aliases);
	if (surface.includes('import(')) {
		throw new Error('the API surface prints a type through import(), which depends on the local path');
	}
	return surface;
}

/**
 * @param {string} expected
 * @param {string} actual
 * @returns {Array<string>}
 */
function diffLines(expected, actual) {
	const expectedLines = expected.split('\n');
	const actualLines = actual.split('\n');
	return [
		...expectedLines.filter(line => !actualLines.includes(line)).map(line => `- ${line}`),
		...actualLines.filter(line => !expectedLines.includes(line)).map(line => `+ ${line}`),
	];
}

if (require.main === module) {
	const mode = process.argv[2];
	const actual = printApiSurface(ROOT);
	if (mode === '--write') {
		fs.writeFileSync(SNAPSHOT_FILE, actual);
	} else if (mode === '--check') {
		const expected = fs.existsSync(SNAPSHOT_FILE) ? fs.readFileSync(SNAPSHOT_FILE, 'utf8') : '';
		if (actual !== expected) {
			console.error('The public types differ from tests/types/api-surface.txt. Review the diff; if the change is intended, run npm run api-surface.');
			console.error(diffLines(expected, actual).join('\n'));
			process.exitCode = 1;
		}
	} else {
		console.error('usage: node tests/types/api-surface.js --check | --write');
		process.exitCode = 2;
	}
}

module.exports = {printApiSurface, canonicalizeAliases};
