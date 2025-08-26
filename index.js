// Date Formatter. Used for formatting dates on logs.
// More customizable way of formatting all the bot logs at the same time.
const { dateOptions } = require('./config.js');
global.DateFormatter = new Intl.DateTimeFormat(undefined, dateOptions); // Ensures a global Date Formatter usable in any bot.
console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Starting up...');

// Startup variables.
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let verbose = false;
const startDate = Date.now(); // tracks current date lol

// Catches uncaught exceptions and puts them towards the regular event handler.
// This likely happens when there is a serious error with the bot in either its shutdown or startup procedures.
// This is put close to first for priority reasons.
process.on('uncaughtException', async (err, origin) => {
	console.log("[" + DateFormatter.format(Date.now()) + `] [CRITICAL] A critical, unhandled error happened in the server software, and the server has to stop.`);
	console.log("[" + DateFormatter.format(Date.now()) + `] [CRITICAL] Something went seriously wrong.`);
	console.log("[" + DateFormatter.format(Date.now()) + `] [CRITICAL] If safe mode doesn't help you, report exactly what you did to the bot developer.`);
	if (verbose) {
		console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Full stack trace:`);
		console.log(err);
		console.log(origin);
	}
	console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Logging the console output.');
	await delay(1000);
	console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Ending process with exit code 1.');
	process.exit(1);
});

// Process arguments that change parts of how the bot works.
// --log-disable: Disables any logging functionality of the bot. Useful if saving logs take up a lot of storage.
// --safe: Enables safe mode, removes all plugins. Use this before reporting a bug with the server itself.
// --chat-log: Saves a log of every single message ever sent, or edited, in every server the bot is in. Overrides the bot status to indicate spying is enabledd.
// --no-update: Disables automatic updating.
// --verbose: Gives more information in the log. This information is required when bug-reporting.
// More are to be added in the future.
let logging = true;
let safeMode = false;
let chatLog = false;
let autoUpdate = true;
process.argv.forEach(function (val, index, array) {
	switch (val) {
		case '--log-disable':
			logging = false;
			break;
		case '--safe':
			safeMode = true;
			verbose = true;
			autoUpdate = false;
			break;
		case '--chat-log':
			chatLog = true;
			break;
		case '--no-update':
			autoUpdate = false;
			break;
		case '--verbose':
			verbose = true;
			break;
	}
});
if (verbose) {
	console.log("[" + DateFormatter.format(Date.now()) + '] [INFO]', `Verbose mode is enabled. Additional information will be given.`);
}

if (verbose) {
	console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Loading config files and setup variables.');
} else {
	console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Loading startup files and functions.`);
}

// Load constants and required files.
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const { REST, Routes } = require('discord.js');
const { spawn } = require('child_process');
const { Client, Collection, Events, GatewayIntentBits, PermissionsBitField, Partials, MessageFlags, ActivityType } = require('discord.js');
const { clientId, token, version, intents, partials, logFormat, versionID, botActivity, botStatus, botURL, botType } = require('./config.js');
const fetch = require('node-fetch');

// Create files if they don't exist.
var dirs = ['./logs', './plugins', './preload'];
for (let i = 0; i < dirs.length; i++) {
	if (!fs.existsSync(dirs[i])) {
		if (verbose) {
			console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Creating folder ${dirs[i]}.`);
		}
		fs.mkdirSync(dirs[i]);
	}
}

// More constants that may depend on folders existing.
const helpMenu = [];
const commands = [];
const commandList = [];
const preloadPath = path.join(__dirname, 'preload');
const pluginPath = path.join(__dirname, 'plugins');
const preloadFolders = fs.readdirSync(preloadPath);
const pluginFolders = fs.readdirSync(pluginPath);

// Prepares dependancy functions.
const rl = readline.createInterface({
	input: process.stdin,
});
const prompt = (query) => new Promise((resolve) => rl.question(query, resolve));
const originalWrite = process.stdout.write;

// Load non-constants.
let consoleOpen = true;
let count = 0;
let latestVersion = 0;

// Set up the log. This is only done if logging is on.
let outputFileStream;
if (logging) {
	outputFileStream = fs.createWriteStream(`logs/${logFormat}.txt`, { 'flags': 'a' });
	if (verbose) {
		console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Setting up the log.');
	}
	outputFileStream.write(`-----------------Info-------------------\n`);
	outputFileStream.write(`|  These logs are for debug purposes.  |\n`);
	outputFileStream.write(`|    Logging is optional with args.    |\n`);
	outputFileStream.write(`|    Logs are turned on by default.    |\n`);
	outputFileStream.write(`----------------------------------------\n`);

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
} else {
	console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Logging has been disabled.');
}

if (verbose) {
	console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Loading error handlers and other functions.');
}

// Update checker
const getUpdateVersion = async () => {
	try {
		if (!safeMode) {
			const update = await fetch('https://raw.githubusercontent.com/Nexints/open-bot/refs/heads/main/config.js');
			const tmp = await update.text();
			let version = 0;
			for (let i = 0; i < tmp.split("\n").length; i++) {
				if (tmp.split("\n")[i].includes("versionID")) {
					version = tmp.split("\n")[i].replace(/\D/g, "");
				}
			}
			return version;
		}
		console.log("[" + DateFormatter.format(Date.now()) + '] [WARN] Safe mode is on. Version checking will not occur.');
		return 0;
	} catch (error) {
		console.log("[" + DateFormatter.format(Date.now()) + `] [ERROR] An error happened while trying to check for updates!`);
		console.log("[" + DateFormatter.format(Date.now()) + `] [ERROR] Likely caused by the bot being unable to access Github. Full stack trace:`);
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
		console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Logging the console output.');
		await delay(1000);
		console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Ending process.');
		console.log("[" + DateFormatter.format(Date.now()) + '] [INFO]', '\x1b[36m--------------------- Nex 2025 ---------------------\x1b[0m');
		process.exit(0);
	})();
}

// Handles errors before the bot goes live.
const errorHandler = async function (error) {
	console.log("[" + DateFormatter.format(Date.now()) + `] [ERROR] A severe error happened in the server software, and the server has to stop.`);
	console.log("[" + DateFormatter.format(Date.now()) + `] [ERROR] This is most likely due to bad configurations or an outdated server.`);
	if (verbose) {
		console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Full stack trace:`);
		console.error(error);
	}
	await exitHandler();
}

// Handles errors when the bot goes live.
// This simply makes sure the bot exits cleanly, and doesn't abruptly terminate.
const liveErrorHandler = async function (error) {
	console.log("[" + DateFormatter.format(Date.now()) + `] [ERROR] A severe error happened in the server software, and the server has to stop.`);
	console.log("[" + DateFormatter.format(Date.now()) + `] [ERROR] This is most likely due to outdated or invalid plugins.`);
	if (verbose) {
		console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Full stack trace:`);
		console.error(error);
	}
	console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Ending bot execution.');
	console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Closing console access.');
	rl.close();
	console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Closing bot connections.');
	client.destroy();
	await exitHandler();
}
if (verbose) {
	console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Scanning for javascript files to preload...');
} else {
	console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Loading external plugins, files, and commands.');
}
console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Be aware that I am not responsible for the actions external plugins do to modify server code.');

// Main function!
(async () => {
	try {
		// Loader code for the main server instance.
		// This jank piece of code loads commands and plugins.
		if (!safeMode) {
			for (const folder of preloadFolders) {
				const commandsPath = path.join(preloadPath, folder);
				const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
				for (const file of commandFiles) {
					const filePath = path.join(commandsPath, file);
					const command = require(filePath);
					if ('execute' in command) {
						if (verbose) {
							console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Pre-loading the file "${filePath}".`);
						}
						command.execute();
					} else {
						console.log("[" + DateFormatter.format(Date.now()) + `] [WARN] The pre-loaded file at ${filePath} is missing a required "execute" property. Nothing will be done.`);
					}
					count += 1;
				}
			}
		}
		latestVersion = await getUpdateVersion();
		if (verbose) {
			console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Found ${count} files.`);
			console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Making exports available.');
		}

		// Export some of the constants and functions that may be needed by other files.
		// This acts as an endpoint for other plugins to use.
		// Will be added onto more as time goes on. Endpoint APIs will most likely not be deleted unless a major revision is in order.
		module.exports = {
			helpMenu: helpMenu,
			readline: rl,
			spawn: spawn,
			exitHandler,
			latestVersion: latestVersion,
			chatLog: chatLog,
		}

		if (verbose) {
			console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Reloading all commands.');
		}

		// Scan for plugins. The command list here is used by the rest of the bot.
		if (!safeMode) {
			for (const folder of pluginFolders) {
				const commandsPath = path.join(pluginPath, folder);
				const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
				for (const file of commandFiles) {
					const filePath = path.join(commandsPath, file);
					commandList.push(filePath);
					const command = require(filePath);
					if ('data' in command && 'execute' in command) {
						if (verbose) {
							console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Pushing the command "${command.data.name}" in "${filePath}" to JSON.`);
						}
						commands.push(command.data.toJSON());
					} else if (!('execute' in command || 'help' in command || 'command' in command || 'messageCreate' in command)) {
						console.log("[" + DateFormatter.format(Date.now()) + `] [WARN] The command at ${filePath} is not a valid plugin file.`);
					}
				}
			}
		}
		if (verbose) {
			console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Cached ${commands.length} commands.`);
		}

		// Reloads slash commands
		const rest = new REST().setToken(token);
		if (verbose) {
			console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Started reloading ${commands.length} commands.`);
		}

		const data = await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);

		if (verbose) {
			console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Successfully reloaded ${data.length} commands.`);
		}

		// Sets up the discord client and other collections.
		global.client = new Client({
			intents: intents,
			partials: partials
		});

		if (verbose) {
			console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Client created.');
		}

		client.cooldowns = new Collection();
		client.commands = new Collection();

		if (verbose) {
			console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Scanning for files.');
		}

		count = 0;

		// Re-scan (AGAIN) for plugins.
		if (!safeMode) {
			for (let i = 0; i < commandList.length; i++) {
				count++;
				const command = require(commandList[i]);
				if ('data' in command && 'execute' in command) {
					if (verbose) {
						console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Loading the command "${command.data.name}" in "${commandList[i]}".`);
					}
					client.commands.set(command.data.name, command);
				} else if ('execute' in command) {
					if (verbose) {
						console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Loading the JS file "${commandList[i]}".`);
					}
					command.execute();
				} else if ('help' in command) {
					if (verbose) {
						console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Adding the JS file "${commandList[i]}" to the console help menu.`);
					}
					helpMenu.push(...command.help());
				} else if (!('command' in command || 'messageCreate' in command)) {
					console.log("[" + DateFormatter.format(Date.now()) + `] [WARN] The file at ${commandList[i]} is not a valid plugin file.`);
				}
			}
		}
		if (verbose) {
			console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] ${count} files loaded.`);
		} else {
			console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Finished loading ${count} files.`);
		}

		// Actions the bot should do when it's ready.
		// Even with the built in (custom coded) plugins, it still says the instance is modified.
		client.once(Events.ClientReady, async readyClient => {
			if (verbose) {
				console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Client is ready.');
			}
			try {

				// Logs the custom startup message.
				console.log("[" + DateFormatter.format(Date.now()) + '] [INFO]', '\x1b[36m----------------------------------------------------\x1b[0m');
				console.log("[" + DateFormatter.format(Date.now()) + '] [INFO]', "              Welcome to Nexint's bot!              ");
				console.log("[" + DateFormatter.format(Date.now()) + '] [INFO]', "           You are running version: " + version);
				console.log("[" + DateFormatter.format(Date.now()) + '] [INFO]', "       Stay up to date for the best features.       ");
				if (safeMode) {
					console.log("[" + DateFormatter.format(Date.now()) + '] [INFO]', "        Stop the bot by killing the process!        ");
				} else {
					console.log("[" + DateFormatter.format(Date.now()) + '] [INFO]', "             Modify the bot with /help!             ");
				}
				if (count > 0) {
					console.log("[" + DateFormatter.format(Date.now()) + '] [INFO]', `             This instance is modified.             `);
				} else if (safeMode) {
					console.log("[" + DateFormatter.format(Date.now()) + '] [INFO]', `                 Safe mode enabled.                 `);
				}
				console.log("[" + DateFormatter.format(Date.now()) + '] [INFO]', '\x1b[36m----------------------------------------------------\x1b[0m');

				// Version checking.
				if (versionID < latestVersion) {
					console.log("[" + DateFormatter.format(Date.now()) + '] [WARN]', `You're running an outdated version of this bot! (You are ${latestVersion - versionID} commits behind)`);
					console.log("[" + DateFormatter.format(Date.now()) + '] [WARN]', `Update now at https://github.com/Nexints/open-bot to make sure that your bot has the latest security fixes!`);
					if ((latestVersion - versionID) >= 5) {
						console.log("[" + DateFormatter.format(Date.now()) + '] [WARN]', `You are over 5 commits behind. Update to the latest version as soon as possible.`);
					}
				} else if (latestVersion == 0) {
					if (!safeMode) {
						console.log("[" + DateFormatter.format(Date.now()) + '] [WARN]', `I can't check for updates!`);
						console.log("[" + DateFormatter.format(Date.now()) + '] [WARN]', `This may lead to unknown errors. Here be dragons!`);
					}
				} else if (versionID > latestVersion) {
					console.log("[" + DateFormatter.format(Date.now()) + '] [WARN]', `You're running an experimental version of this bot! (You are ${versionID - latestVersion} commits ahead)`);
					console.log("[" + DateFormatter.format(Date.now()) + '] [WARN]', `Here be dragons!`);
				} else {
					console.log("[" + DateFormatter.format(Date.now()) + '] [INFO]', `You're running the latest version of this bot!`);
				}
				console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Done! Logged in as ${readyClient.user.tag} in ${(Date.now() - startDate) / 1000} seconds.`);

				// Startup options.
				if (safeMode) {
					console.log("[" + DateFormatter.format(Date.now()) + '] [INFO]', `Zero plugins or pre-loaded files are being used, verbose mode is enabled, and logging is disabled.`);
				}
				if (verbose) {
					console.log("[" + DateFormatter.format(Date.now()) + '] [INFO]', `Verbose mode is enabled. Additional information will be given.`);
				} else {
					console.log("[" + DateFormatter.format(Date.now()) + '] [INFO]', `Verbose mode is disabled. Verbose mode needs to be enabled to report bugs.`);
				}
				if (chatLog) {
					client.user.setPresence({
						activities: [{
							name: "Bot spying Enabled! (Dev-mode)",
							type: ActivityType.Custom,
							url: botURL
						}],
						status: botStatus
					});
				} else {
					client.user.setPresence({
						activities: [{
							name: botActivity,
							type: botType,
							url: botURL
						}],
						status: botStatus
					});
				}
				if (verbose) {
					console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Client status set. Change this in /config.js!');
				}
				asyncFunctions().catch(async error => await liveErrorHandler(error));
			} catch (error) {
				await errorHandler(error);
			}

		});

		// Login to the bot
		client.login(token);
	} catch (error) {
		await errorHandler(error);
	}
})();

// Parses functions that happen asyncronously when the bot finishes starting. Handles update checks, etc.
const asyncFunctions = async () => {
	commandParser().catch(async error => await liveErrorHandler(error));
	if (autoUpdate) {
		updateCheck().catch(async error => await liveErrorHandler(error));
	} else {
		console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Automatic update checking disabled.');
	}
}

// Command Parser - parses the commands, and the main part of the console.
const commandParser = async () => {
	while (consoleOpen) {
		const command = await prompt('');
		if (logging) {
			outputFileStream.write(command + '\n');
		}
		let validCommand = false;
		for (let i = 0; i < commandList.length; i++) {
			const cmd = require(commandList[i]);
			if ('command' in cmd) {
				if (verbose) {
					console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Loading the commands in "${commandList[i]}".`);
				}
				validCommand = await cmd.command(command);
				if (validCommand) {
					i = commandList.length; // Skip processing more commands if one is valid. Saves time.
				}
			}
		}
		if (validCommand == false) {
			console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] This command is not a valid command.');
		}
	}
}

// Update checks - Asyncronously checks updates.
const updateCheck = async () => {
	console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Automatic update checking enabled');
	while (consoleOpen) {
		await delay(3600000); // artificial delay to ensure host's CPU doesn't die
		latestVersion = await getUpdateVersion();
		if (versionID < latestVersion) {
			console.log("[" + DateFormatter.format(Date.now()) + '] [WARN]', `You're running an outdated version of this bot! (You are ${latestVersion - versionID} commits behind)`);
			console.log("[" + DateFormatter.format(Date.now()) + '] [WARN]', `Update now at https://github.com/Nexints/open-bot to make sure that your bot has the latest security fixes!`);
			if ((latestVersion - versionID) >= 5) {
				console.log("[" + DateFormatter.format(Date.now()) + '] [WARN]', `You are over 5 commits behind. Update to the latest version as soon as possible.`);
			}
		} else if (versionID > latestVersion) {
			console.log("[" + DateFormatter.format(Date.now()) + '] [WARN]', `You're running an experimental version of this bot! (You are ${versionID - latestVersion} commits ahead)`);
			console.log("[" + DateFormatter.format(Date.now()) + '] [WARN]', `Here be dragons!`);
		}
	}
}