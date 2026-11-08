const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const CONSUMER_FILES = ['consumer.ts', 'consumer.js', 'consumer-patterns/globals.d.ts', 'consumer-patterns/usage.js'];

/**
 * @param {string} command
 * @param {Array<string>} args
 * @param {string} cwd
 * @returns {string}
 */
function run(command, args, cwd) {
	const result = childProcess.spawnSync(command, args, {cwd, encoding: 'utf8'});
	if (result.status !== 0) {
		throw new Error(`${command} ${args.join(' ')} failed:\n${result.stdout}${result.stderr}`);
	}
	return result.stdout;
}

/**
 * @param {string} directory
 */
function installPackedPackage(directory) {
	const [packed] = JSON.parse(run('npm', ['pack', '--json', '--pack-destination', directory], ROOT));
	const modules = path.join(directory, 'node_modules');
	fs.mkdirSync(modules);
	run('tar', ['-xzf', path.join(directory, packed.filename), '-C', modules], ROOT);
	fs.renameSync(path.join(modules, 'package'), path.join(modules, 'steam-badge-unlocker'));
	fs.symlinkSync(path.join(ROOT, 'node_modules', '@types'), path.join(modules, '@types'), 'dir');
}

/**
 * @param {string} directory
 */
function writeConsumer(directory) {
	CONSUMER_FILES.forEach((file) => {
		fs.mkdirSync(path.dirname(path.join(directory, file)), {recursive: true});
		fs.copyFileSync(path.join(__dirname, file), path.join(directory, file));
	});
	fs.writeFileSync(path.join(directory, 'tsconfig.json'), JSON.stringify({
		compilerOptions: {
			strict: true,
			noEmit: true,
			module: 'nodenext',
			moduleResolution: 'nodenext',
			target: 'es2018',
			allowJs: true,
			checkJs: true,
			esModuleInterop: true,
			types: [],
		},
		files: CONSUMER_FILES,
	}, null, 2));
}

if (require.main === module) {
	const version = process.argv[2] || 'latest';
	const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'steam-badge-unlocker-packed-'));
	try {
		installPackedPackage(directory);
		writeConsumer(directory);
		const result = childProcess.spawnSync('npx', ['-y', '-p', `typescript@${version}`, 'tsc', '-p', directory], {cwd: directory, encoding: 'utf8'});
		process.stdout.write(result.stdout + result.stderr);
		process.exitCode = result.status === 0 ? 0 : 1;
	} finally {
		fs.rmSync(directory, {recursive: true, force: true});
	}
}
