const { SlashCommandBuilder, MessageFlags, PermissionsBitField } = require('discord.js');
const { devID } = require("./../../config.js");

module.exports = {
	cooldown: 3,
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Need help tinkering?')
		.addIntegerOption(option =>
			option
				.setName('page')
				.setRequired(true)
				.setDescription('Page.')),
	async execute(interaction) {
		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
		if ((interaction.guild != null && interaction.channel.permissionsFor(interaction.guild.members.me).has(['ViewChannel', 'SendMessages'], true)) || interaction.guild == null) {
			let helpMessage = "# Help Menu:";
			let helpArray = [];
			if (interaction.user.id == devID) {
				helpArray.push("**Bot Owner commands:**");
				helpArray.push("- /restart: Restarts the bot.");
				helpArray.push("- /dev clear: Clears something from the bot.");
				helpArray.push("- /dev update: Updates a channel with a message.");
				helpArray.push("- /dev allow: Allows another user to broadcast updates to a specific channel.");
				helpArray.push("- /dev deny: Denies another user all permissions to broadcast updates.");
				helpArray.push("- /send: Sends a message as the bot! Only works if the bot owner has permission to send messages here and has the \"manage messages\" permission.");
			}
			if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
				helpArray.push("**Admin commands:**");
				helpArray.push("- /config blacklist: Configures the channel blacklist with either a strict or lenient word block.");
				helpArray.push("- /config links: Configures whether links should be allowed here or not.");
				helpArray.push("- /config invites: Configures whether invites should be allowed here or not.");
				helpArray.push("- /config updates: Configures whether or not updates from the bot owner should be sent to that channel, and there are different channels to use.");
				helpArray.push("- /config logging: Configures whether logging is enabled or not for the entire server. The channel where this message is ran will be the channel where logs are put. Moderation events will be put here as well.");
				helpArray.push("-# More admin commands are to be added at a later time.");
			}
			if (interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers) || interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
				helpArray.push("**Moderator commands:**");
				if (interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
					helpArray.push("- /ban: Bans the ID specified.");
				}
				if (interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
					helpArray.push("- /kick: Kicks the ID specified.");
				}
				if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
					helpArray.push("- /warn: Warns the ID specified.");
					helpArray.push("- /viewwarn: Views warns for the ID specified.");
					helpArray.push("- /liftwarn: Unwarns the ID specified.");
				}
				helpArray.push("-# More moderator commands are to be added at a later time.");
			}
			// Utils
			helpArray.push("**Utility commands:**");
			helpArray.push("- /help: Provides this help menu.");
			helpArray.push("- /info: Provides an info manual about the bot.");
			helpArray.push("- /optout: Opts out of data collection. Moderation services still require your data, and this is per-user. (Server / Bot owners should opt-out in config.js!)");
			helpArray.push("- /optin: Opts into data collection.")

			// Fun stuff
			helpArray.push("**Fun commands:**");
			helpArray.push("- /hello: Sends a hello message to the person specified.");
			helpArray.push("- /hug: Hugs the person specified.");
			helpArray.push("- /kiss: Kisses the person specified.");
			helpArray.push("- /pat: Pats the person specified.");

			//silly stuff
			helpArray.push("**Silly commands: (Removed on v1.0)**");
			helpArray.push("- /badapple: Sends a bad apple YT URL. Only works if links aren't blacklisted.");
			helpArray.push("- /silly: Silly.");
			helpArray.push("- /mizuover: It's so Mizuover. That's all you need to know.");
			helpArray.push("-# This help menu only gives you help for commands you have permission to use.")

			let page = interaction.options.getInteger("page");
			let pageSize = 15;
			if (helpArray[(page - 1) * pageSize] == undefined) {
				helpMessage = helpMessage + `\n\nThe page that you have requested is not within bounds. Only pages between 1 and ${Math.ceil((helpArray.length) / pageSize)} are valid.`;
			} else {
				for (let i = (page - 1) * pageSize; i < Math.min(pageSize + ((page - 1) * pageSize), helpArray.length); i++) {
					helpMessage = helpMessage + "\n" + helpArray[i];
				}
			}
			helpMessage = helpMessage + `\n--- Page (${page}/${Math.ceil((helpArray.length) / pageSize)}). © Nexint 2025. All Rights Reserved. ---`;
			await interaction.reply({
				content: helpMessage,
				flags: MessageFlags.Ephemeral
			});
		} else {
			await interaction.reply({
				content: "This bot does not have the permissions to provide adedquete help.\n-# Please provide the bot with view channel and send messages permissions.",
				flags: MessageFlags.Ephemeral
			});
			console.log("[" + DateFormatter.format(Date.now()) + `] [WARN] The bot does not have permission to send help messages. Channel: ${interaction.channel.id}.`);
		}

	},
};