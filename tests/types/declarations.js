const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ENTRY_FILE = '__declaration_entry__.ts';

/**
 * @param {string} root
 * @returns {Array<[string, string]>} the import name and the module path, relative to root, of each entry import
 */
function entryImports(root) {
	const resources = fs.readdirSync(path.join(root, 'resources'))
		.filter(file => file.endsWith('.d.ts'))
		.map(file => file.slice(0, -'.d.ts'.length))
		.sort();
	return [
		['SteamBadgeUnlocker', 'index'],
		['Helpers', 'components/helpers'],
		...resources.map(name => [name, `resources/${name}`]),
	];
}

/**
 * @param {string} root
 * @returns {string}
 */
function entrySource(root) {
	return `${entryImports(root).map(([name, relPath]) => `import ${name} = require('./${relPath}');`).join('\n')}\n`;
}

/**
 * @param {string} root
 * @returns {ts.Program}
 */
function createProgram(root) {
	const options = {
		strict: true,
		noEmit: true,
		types: [],
		target: ts.ScriptTarget.ES2018,
		module: ts.ModuleKind.CommonJS,
		moduleResolution: ts.ModuleResolutionKind.Node10,
	};
	const entryPath = path.join(root, ENTRY_FILE);
	const entryText = entrySource(root);
	const host = ts.createCompilerHost(options);
	const getSourceFile = host.getSourceFile;
	const fileExists = host.fileExists;
	const readFile = host.readFile;
	host.getSourceFile = (fileName, languageVersion, ...rest) => (fileName === entryPath
		? ts.createSourceFile(fileName, entryText, languageVersion, true)
		: getSourceFile.call(host, fileName, languageVersion, ...rest));
	host.fileExists = fileName => fileName === entryPath || fileExists.call(host, fileName);
	host.readFile = fileName => (fileName === entryPath ? entryText : readFile.call(host, fileName));
	const program = ts.createProgram([entryPath], options, host);
	const diagnostics = ts.getPreEmitDiagnostics(program);
	if (diagnostics.length > 0) {
		throw new Error(ts.formatDiagnostics(diagnostics, host));
	}
	return program;
}

/**
 * @param {ts.Symbol} symbol
 * @returns {boolean}
 */
function isPublic(symbol) {
	return symbol.name !== 'constructor' && symbol.name !== 'prototype' && !symbol.name.startsWith('_');
}

/**
 * @param {Array<ts.Symbol>} symbols
 * @returns {Array<string>}
 */
function sortedNames(symbols) {
	return symbols.map(symbol => symbol.name).sort();
}

/**
 * @param {string} root
 */
function createDeclarationModel(root) {
	const program = createProgram(root);
	const checker = program.getTypeChecker();
	const entry = program.getSourceFile(path.join(root, ENTRY_FILE));
	const imports = new Map(entry.statements
		.filter(ts.isImportEqualsDeclaration)
		.map(statement => [statement.name.text, checker.getAliasedSymbol(checker.getSymbolAtLocation(statement.name))]));
	const unlocker = imports.get('SteamBadgeUnlocker');
	const typeOf = symbol => checker.getTypeOfSymbolAtLocation(symbol, entry);
	const namespaceExports = () => {
		const symbols = [];
		unlocker.exports.forEach(symbol => symbols.push(symbol));
		return symbols.sort((a, b) => (a.name < b.name ? -1 : 1));
	};
	const moduleSymbol = (relPath) => {
		const sourceFile = program.getSourceFile(path.join(root, `${relPath}.d.ts`));
		return sourceFile ? checker.getSymbolAtLocation(sourceFile) : undefined;
	};
	const namespaceInterface = (name) => {
		const symbol = namespaceExports().find(item => item.name === name && (item.flags & ts.SymbolFlags.Interface));
		if (!symbol) {
			throw new Error(`no interface SteamBadgeUnlocker.${name}`);
		}
		return symbol;
	};

	return {
		ts,
		program,
		checker,
		entry,
		unlocker,
		imports,
		entryImports: () => entryImports(root),
		typeOf,
		namespaceExports,
		moduleSymbol,
		instanceType: () => checker.getDeclaredTypeOfSymbol(unlocker),
		staticType: () => typeOf(unlocker),
		instanceMembers: () => sortedNames(checker.getPropertiesOfType(checker.getDeclaredTypeOfSymbol(unlocker)).filter(isPublic)),
		staticExports: () => sortedNames(checker.getPropertiesOfType(typeOf(unlocker)).filter(isPublic)),
		namespaceTypes: () => namespaceExports().filter(symbol => symbol.flags & (ts.SymbolFlags.TypeAlias | ts.SymbolFlags.Interface)),
		interfaceMembers: name => sortedNames(checker.getPropertiesOfType(checker.getDeclaredTypeOfSymbol(namespaceInterface(name)))),
		moduleExports: (relPath) => {
			const symbol = moduleSymbol(relPath);
			if (!symbol) {
				throw new Error(`no declaration file ${relPath}.d.ts in the program`);
			}
			return sortedNames(checker.getExportsOfModule(symbol).filter(item => item.flags & ts.SymbolFlags.Value));
		},
		enumValues: (relPath) => {
			const symbol = moduleSymbol(relPath);
			if (!symbol) {
				throw new Error(`no declaration file ${relPath}.d.ts in the program`);
			}
			const values = {};
			checker.getPropertiesOfType(typeOf(checker.resolveExternalModuleSymbol(symbol))).forEach((property) => {
				const type = typeOf(property);
				values[property.name] = type.isLiteral() ? type.value : checker.typeToString(type);
			});
			return values;
		},
	};
}

module.exports = {createDeclarationModel};
