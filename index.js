console.log("[" + new Date().toLocaleTimeString() + '] [INFO] Starting up...');

// Catches uncaught exceptions and puts them towards the regular event handler.
// This likely happens when there is a serious error with the bot in either its shutdown or startup procedures.
// This is put first for priority reasons.
process.on('uncaughtException', (err, origin) => {
	console.log("[" + new Date().toLocaleTimeString() + `] [ERROR] A critical error happened in the server software, and the server software has to stop.`);
	console.error(err);
	console.log("[" + new Date().toLocaleTimeString() + '] [INFO] Ending process.');
	process.exit(1);
});

console.log("[" + new Date().toLocaleTimeString() + '] [INFO] Loading config files and setup variables.');

// Load constants and required files
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const { REST, Routes } = require('discord.js');
const { spawn } = require('child_process');
const { Client, Collection, Events, GatewayIntentBits, PermissionsBitField, Partials, MessageFlags } = require('discord.js');
const { clientId, token, version, intents, partials, logFormat, versionID } = require('./config.js');
const fetch = require('node-fetch');

// Create files if they don't exist.
var dirs = ['./logs', './plugins', './preload'];
for (let i = 0; i < dirs.length; i++) {
	if (!fs.existsSync(dirs[i])) {
		console.log("[" + new Date().toLocaleTimeString() + `] [INFO] Creating folder ${dirs[i]}.`);
		fs.mkdirSync(dirs[i]);
	}
}

// More constants that may depend on folders existing!
const helpMenu = [];
const commands = [];
const commandList = [];
const preloadPath = path.join(__dirname, 'preload');
const pluginPath = path.join(__dirname, 'plugins');
const preloadFolders = fs.readdirSync(preloadPath);
const pluginFolders = fs.readdirSync(pluginPath);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Prepares dependancy functions
const rl = readline.createInterface({
	input: process.stdin,
});
const prompt = (query) => new Promise((resolve) => rl.question(query, resolve));
const originalWrite = process.stdout.write;

// Load non-constants.
let consoleOpen = true;
let count = 0;
let outputFileStream = fs.createWriteStream(`logs/${logFormat}.txt`, { 'flags': 'a' });
let latestVersion = 0;

console.log("[" + new Date().toLocaleTimeString() + '] [INFO] Loading error handlers and other functions.');

// Override the logging function to log to a file. Done for outputs and errors.
process.stdout.write = function () {
	const result = originalWrite.apply(process.stdout, arguments);
	outputFileStream.write.apply(outputFileStream, arguments);
	return result;
};
process.stderr.write = function () {
	const result = originalWrite.apply(process.stderr, arguments);
	outputFileStream.write.apply(outputFileStream, arguments);
	return result;
};

// Update checker
const getUpdateVersion = async () => {
	try {
		const update = await fetch('https://raw.githubusercontent.com/Nexints/open-bot/refs/heads/main/config.js');
		const tmp = await update.text();
		let version = 0;
		for (let i = 0; i < tmp.split("\n").length; i++) {
			if (tmp.split("\n")[i].includes("versionID")) {
				version = tmp.split("\n")[i].replace(/\D/g, "");
			}
		}
		return version;
	} catch (error) {
		console.log("[" + new Date().toLocaleTimeString() + `] [ERROR] An error happened while trying to check for updates!`);
		console.log("[" + new Date().toLocaleTimeString() + `] [ERROR] Likely caused by the bot being unable to access github. Full stack trace:`);
		console.error(error);
		return 0;
	}
};

// Instantiate error catchers and shutdown functions
// Handles the shutdown process after ending the bot execution
const exitHandler = async function () {
	consoleOpen = false;
	(async () => {
		// Console output is already logged, just needs time to log to a file.
		// Arbitrary delay(?)
		console.log("[" + new Date().toLocaleTimeString() + '] [INFO] Logging the console output.');
		await delay(1000);
		console.log("[" + new Date().toLocaleTimeString() + '] [INFO] Ending process.');
		process.exit(0);
	})();
}

// Handles errors before the bot goes live.
const errorHandler = async function (error) {
	console.log("[" + new Date().toLocaleTimeString() + `] [ERROR] A critical error happened in the server software, and the server software has to stop.`);
	console.error(error);
	await exitHandler();
}

// Handles errors when the bot goes live.
// This simply makes sure the bot exits cleanly, and doesn't abruptly terminate.
const liveErrorHandler = async function (error) {
	console.log("[" + new Date().toLocaleTimeString() + `] [ERROR] A critical error happened in the server software, and the server software has to stop.`);
	console.error(error);
	console.log("[" + new Date().toLocaleTimeString() + '] [INFO] Ending bot execution.');
	console.log("[" + new Date().toLocaleTimeString() + '] [INFO] Closing console access.');
	rl.close();
	console.log("[" + new Date().toLocaleTimeString() + '] [INFO] Closing bot connections.');
	client.destroy();
	await exitHandler();
}
console.log("[" + new Date().toLocaleTimeString() + '] [INFO] Scanning for javascript files to preload...');

// Main function!
(async () => {
	try {
		// Loader code for the main server instance.
		// This jank piece of code loads commands and plugins.
		for (const folder of preloadFolders) {
			const commandsPath = path.join(preloadPath, folder);
			const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
			for (const file of commandFiles) {
				const filePath = path.join(commandsPath, file);
				const command = require(filePath);
				if ('execute' in command) {
					command.execute();
				} else {
					console.log("[" + new Date().toLocaleTimeString() + `] [ERROR] The pre-loaded file at ${filePath} is missing a required "execute" property. The server will now stop to prevent potential errors.`);
					throw new Error(`File ${filePath} does not contain required execute property.`);
				}
				count += 1;
			}
		}
		console.log("[" + new Date().toLocaleTimeString() + `] [INFO] Found ${count} files.`);
		console.log("[" + new Date().toLocaleTimeString() + '] [INFO] Making exports available.');
		latestVersion = await getUpdateVersion();

		// Export some of the constants and functions that may be needed by other files.
		// This acts as an endpoint for other plugins to use.
		// Will be added onto more as time goes on. Endpoint APIs will most likely not be deleted unless a major revision is in order.
		module.exports = {
			helpMenu: helpMenu,
			readline: rl,
			spawn: spawn,
			exitHandler,
			latestVersion: latestVersion
		}

		console.log("[" + new Date().toLocaleTimeString() + '] [INFO] Reloading all commands.');

		// Scan for plugins. The command list here is used by the rest of the bot.
		for (const folder of pluginFolders) {
			const commandsPath = path.join(pluginPath, folder);
			const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
			for (const file of commandFiles) {
				const filePath = path.join(commandsPath, file);
				commandList.push(filePath);
				const command = require(filePath);
				if ('data' in command && 'execute' in command) {
					commands.push(command.data.toJSON());
				} else if (!('execute' in command || 'help' in command || 'command' in command || 'messageCreate' in command)) {
					console.log("[" + new Date().toLocaleTimeString() + `] [WARN] The command at ${filePath} is missing a required "execute" property. This may or may not be intended behavior.`);
				}
			}
		}
		console.log("[" + new Date().toLocaleTimeString() + `] [INFO] Cached ${commands.length} commands.`);

		// Reloads slash commands
		const rest = new REST().setToken(token);
		console.log("[" + new Date().toLocaleTimeString() + `] [INFO] Started reloading ${commands.length} commands.`);

		const data = await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);

		console.log("[" + new Date().toLocaleTimeString() + `] [INFO] Successfully reloaded ${data.length} commands.`);

		// Sets up the discord client and other collections.
		global.client = new Client({
			intents: intents,
			partials: partials
		});

		console.log("[" + new Date().toLocaleTimeString() + '] [INFO] Client created.');

		client.cooldowns = new Collection();
		client.commands = new Collection();

		console.log("[" + new Date().toLocaleTimeString() + '] [INFO] Scanning for files.');

		count = 0;

		// Re-scan (AGAIN) for plugins.
		for (let i = 0; i < commandList.length; i++) {
			count++;
			const command = require(commandList[i]);
			if ('data' in command && 'execute' in command) {
				client.commands.set(command.data.name, command);
			} else if ('execute' in command) {
				console.log("[" + new Date().toLocaleTimeString() + `] [INFO] Evaluating the contents of the JS file "${commandList[i]}". Please be aware I am not responsible for the actions external commands do to modify the server code.`);
				command.execute();
			} else if ('help' in command) {
				helpMenu.push(...command.help());
			} else if (!('command' in command || 'messageCreate' in command)) {
				console.log("[" + new Date().toLocaleTimeString() + `] [WARN] The file at ${commandList[i]} is missing a required "execute" property. The server will ignore this file, as this may be intended behavior by the plugin owner.`);
			}
		}

		console.log("[" + new Date().toLocaleTimeString() + `] [INFO] ${count} files loaded.`);

		// Actions the bot should do when it's ready.
		// Even with the built in (custom coded) plugins, it still says the instance is modified.
		client.once(Events.ClientReady, readyClient => {
			console.log("[" + new Date().toLocaleTimeString() + '] [INFO]', '\x1b[36m----------------------------------------------------\x1b[0m');
			console.log("[" + new Date().toLocaleTimeString() + '] [INFO]', "              Welcome to Nexint's bot!              ");
			console.log("[" + new Date().toLocaleTimeString() + '] [INFO]', "           You are running version: " + version);
			console.log("[" + new Date().toLocaleTimeString() + '] [INFO]', "       Stay up to date for the best features.       ");
			console.log("[" + new Date().toLocaleTimeString() + '] [INFO]', "             Modify the bot with /help!             ");
			if (count > 0) {
				console.log("[" + new Date().toLocaleTimeString() + '] [INFO]', `             This instance is modified.             `);
			}
			console.log("[" + new Date().toLocaleTimeString() + '] [INFO]', '\x1b[36m----------------------------------------------------\x1b[0m');
			if (versionID < latestVersion) {
				console.log("[" + new Date().toLocaleTimeString() + '] [WARN]', `You're running an outdated version of this bot! (You are ${latestVersion - versionID} commits behind)`);
				console.log("[" + new Date().toLocaleTimeString() + '] [WARN]', `Update now at https://github.com/Nexints/open-bot`);
			} else if (latestVersion == 0) {
				console.log("[" + new Date().toLocaleTimeString() + '] [WARN]', `I can't check for updates!`);
				console.log("[" + new Date().toLocaleTimeString() + '] [WARN]', `This bot may be unstable.`);
			} else if (versionID > latestVersion) {
				console.log("[" + new Date().toLocaleTimeString() + '] [WARN]', `You're running an experimental version of this bot! (You are ${versionID - latestVersion} commits ahead)`);
				console.log("[" + new Date().toLocaleTimeString() + '] [WARN]', `Here be dragons!`);
			} else {
				console.log("[" + new Date().toLocaleTimeString() + '] [INFO]', `You're running the latest version of this bot!`);
			}
			console.log("[" + new Date().toLocaleTimeString() + `] [INFO] Logged in as ${readyClient.user.tag}.`);

			commandParser();
		});

		// Login to the bot
		client.login(token);
	} catch (error) {
		await errorHandler(error);
	}
})();

// Command Parser - parses the commands, and the main part of the console.
const commandParser = async () => {
	while (consoleOpen) {
		try {
			const command = await prompt('');
			let validCommand = false;
			for (let i = 0; i < commandList.length; i++) {
				const cmd = require(commandList[i]);
				if ('command' in cmd) {
					validCommand = await cmd.command(command);
					if (validCommand) {
						i = commandList.length; // Skip processing more commands if one is valid. Saves time.
					}
				}
			}
			if (validCommand == false) {
				console.log("[" + new Date().toLocaleTimeString() + '] [INFO] This command is not a valid command.');
			}
		} catch (error) {
			await liveErrorHandler(error);
		}
	}
}