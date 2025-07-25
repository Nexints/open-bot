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
const { clientId, token, version, intents, partials, logFormat } = require('./config.js');

// Create files if they don't exist.
var dirs = ['./logs', './plugins', './preload'];
for (let i = 0; i < dirs.length; i++) {
	if (!fs.existsSync(dirs[i])) {
		console.log("[" + new Date().toLocaleTimeString() + `] [INFO] Creating folder ${dirs[i]}.`);
		fs.mkdirSync(dirs[i]);
	}
}

// More files that may depend on folders!
const helpMenu = [];
const commands = [];
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

console.log("[" + new Date().toLocaleTimeString() + '] [INFO] Loading error handlers and other functions.');

// Override the logging function to log to a file.
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

console.log("[" + new Date().toLocaleTimeString() + '] [INFO] Making exports available.');

// Export some of the constants and functions that may be needed by other files.
// This acts as an endpoint for other plugins to use.
// Will be added onto more as time goes on. Endpoint APIs will most likely not change unless a major revision is in order.
module.exports = {
	helpMenu: helpMenu,
	readline: rl,
	spawn: spawn,
	exitHandler
}

// Code below may be bad practice due to module.export and import spam, but it works. I have no idea why it does.

// Loader code for the main server instance.
// This jank piece of code loads commands and plugins.
console.log("[" + new Date().toLocaleTimeString() + '] [INFO] Scanning for javascript files to preload...');

// Scanning for pre-load files that may need to be loaded. Often times, these are plugin databases or constants.
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
console.log("[" + new Date().toLocaleTimeString() + '] [INFO] Reloading all commands.');

// Scan for slash commands.
for (const folder of pluginFolders) {
	const commandsPath = path.join(pluginPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else if ('execute' in command || 'help' in command || 'command' in command || 'messageCreate' in command) { } else {
			console.log("[" + new Date().toLocaleTimeString() + `] [WARN] The command at ${filePath} is missing a required "execute" property. This may or may not be intended behavior.`);
		}
	}
}

// The main server file!
// This jank piece of code runs the entire bot. Without it, nothing gets done.
(async () => {
	try {
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

		console.log("[" + new Date().toLocaleTimeString() + '] [INFO] Scanning for plugins.');

		count = 0;

		// Re-scan for plugins.
		for (const folder of pluginFolders) {
			const commandsPath = path.join(pluginPath, folder);
			const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
			count += 1;
			for (const file of commandFiles) {
				const filePath = path.join(commandsPath, file);
				const command = require(filePath);
				if ('data' in command && 'execute' in command) {
					client.commands.set(command.data.name, command);
				} else if ('execute' in command) {
					console.log("[" + new Date().toLocaleTimeString() + `] [INFO] Evaluating the contents of the JS file "${filePath}". Please be aware I am not responsible for the actions external commands do to modify the server code.`);
					command.execute();
				} else if ('help' in command) {
					helpMenu.push(...command.help());
				} else if ('command' in command || 'messageCreate' in command) { } else {
					console.log("[" + new Date().toLocaleTimeString() + `] [WARN] The file at ${filePath} is missing a required "execute" property. The server will ignore this file, as this may be intended behavior by the plugin owner.`);
				}
			}
		}

		console.log("[" + new Date().toLocaleTimeString() + `] [INFO] ${count} plugins loaded.`);

		// Actions the bot should do when it's ready.
		// Even with the built in (custom coded) plugins, it still says the instance is modified.
		client.once(Events.ClientReady, readyClient => {
			console.log("[" + new Date().toLocaleTimeString() + '] [INFO]', '\x1b[36m----------------------------------------\x1b[0m');
			console.log("[" + new Date().toLocaleTimeString() + '] [INFO]', "        Welcome to Nexint's bot!        ");
			console.log("[" + new Date().toLocaleTimeString() + '] [INFO]', "     You are running version: " + version);
			console.log("[" + new Date().toLocaleTimeString() + '] [INFO]', " Stay up to date for the best features. ");
			console.log("[" + new Date().toLocaleTimeString() + '] [INFO]', "       Modify the bot with /help!       ");
			console.log("[" + new Date().toLocaleTimeString() + '] [INFO]', "        (This is an alpha build)        ");
			if (count > 0) {
				console.log("[" + new Date().toLocaleTimeString() + '] [INFO]', `       This instance is modified.       `);
			}
			console.log("[" + new Date().toLocaleTimeString() + '] [INFO]', '\x1b[36m----------------------------------------\x1b[0m');
			console.log("[" + new Date().toLocaleTimeString() + `] [INFO] Logged in as ${readyClient.user.tag}.`);

			commandParser();
		});

		// Handles the interactions between the bot and the person.
		client.on(Events.InteractionCreate, async interaction => {
			if (!interaction.isChatInputCommand()) return;
			const command = client.commands.get(interaction.commandName);

			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}

			const { cooldowns } = interaction.client;

			if (!cooldowns.has(command.data.name)) {
				cooldowns.set(command.data.name, new Collection());
			}

			const now = Date.now();
			const timestamps = cooldowns.get(command.data.name);
			const defaultCooldownDuration = 3;
			const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

			if (timestamps.has(interaction.user.id)) {
				const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

				if (now < expirationTime) {
					const expiredTimestamp = Math.round(expirationTime / 1000);
					return interaction.reply({ content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`, ephemeral: true });
				}
			}

			timestamps.set(interaction.user.id, now);
			setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

			try {
				await command.execute(interaction);
			} catch (error) {
				try {

					if (interaction.replied || interaction.deferred) {
						await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
					} else {
						await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
					}
					liveErrorHandler(error);
				}
				catch (error) {
					liveErrorHandler(error);
				}
			}
		});

		client.login(token);
	} catch (error) {
		await errorHandler(error);
	}
})();

// Misc functions

// Command Parser - parses the commands
// I'm able to put this below, as the top function is async and this function is loaded by the time the bot starts.
const commandParser = async () => {
	while (consoleOpen) {

		// Parse all existing commands.
		// Everything is in a try-catch, to make sure it's handled correctly.
		try {
			const command = await prompt('');
			let validCommand = false;
			for (const folder of pluginFolders) {
				const commandsPath = path.join(pluginPath, folder);
				const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
				count += 1;
				for (const file of commandFiles) {
					const filePath = path.join(commandsPath, file);
					const cmd = require(filePath);
					if ('command' in cmd) {
						if (validCommand == false) {
							validCommand = await cmd.command(command);
						} else {
							await cmd.command(command);
						}
					}
				}
			}
			if (validCommand == false) {
				console.log("[" + new Date().toLocaleTimeString() + '] [INFO] This command is not a valid command.');
			}
			if (process.env.process_restarting) {
				delete process.env.process_restarting;
				// Give old process one second to shut down before continuing ...
				setTimeout(main, 1000);
			}
		} catch (error) {
			await liveErrorHandler(error);
		}
	}
}