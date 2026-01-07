const { SlashCommandBuilder, MessageFlags, PermissionsBitField } = require('discord.js');
const { devID } = require("../../config.js");

module.exports = {
	cooldown: 3,
	data: new SlashCommandBuilder()
		.setName('updatelog')
		.setDescription('Update log for OpenBot.')
		.addIntegerOption(option =>
			option
				.setName('page')
				.setRequired(true)
				.setDescription('Page.')),
	async execute(interaction) {
		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
		if ((interaction.guild != null && interaction.channel.permissionsFor(interaction.guild.members.me).has(['ViewChannel', 'SendMessages'], true)) || interaction.guild == null) {
			let helpMessage = "# Update Log:";
			let helpArray = [];
			
			// Utils
			helpArray.push("**Utility commands:**");
			helpArray.push("- /help: Provides this help menu.");
			helpArray.push("- /info: Provides an info manual about the bot.");
			helpArray.push("- /optin: Opts into data collection.")
			helpArray.push("- /optout: Opts out of data collection. Moderation services still require your data, and this is per-user. (Server / Bot owners should opt-out in config.js!)");

			//Currency stuff
			helpArray.push("**0.0.2:**");
			helpArray.push("- /bal: View how much you have.");
			helpArray.push("- /baltop: Shows the people with the highest currency.");
			helpArray.push("- /coinflip: Flip a coin, earn money or lose money.");
			helpArray.push("- /snakeeyes: Flip a coin, earn money or lose money.");
			helpArray.push("-# I do not endorse underage gambling.")
			helpArray.push("- /pay: Pay a specific person.");
			helpArray.push("- /work: Work for money.");

			// Update 0.0.1
			helpArray.push("**Update 0.0.1:**");
			helpArray.push("- Renamed the project to OpenBot and open sourced it.");
			helpArray.push("- Admin commands implemented.");
			helpArray.push("- First silly command! /badapple");
			helpArray.push("- Beta version of automod has been implemented.");

			// Update 0.0.0
			helpArray.push("**Update 0.0.0:**");
			helpArray.push("- Started work on Nexint Broadcaster (now OpenBot).");
			helpArray.push("- Broadcasting and other dev commands created.");
			helpArray.push("- Opt-in / opt-out system created.");

			let page = interaction.options.getInteger("page");
			let pageSize = 15;
			if (helpArray[(page - 1) * pageSize] == undefined) {
				helpMessage += `\n\nThe page that you have requested is not within bounds. Only pages between 1 and ${Math.ceil((helpArray.length) / pageSize)} are valid.`;
			} else {
				for (let i = (page - 1) * pageSize; i < Math.min(pageSize + ((page - 1) * pageSize), helpArray.length); i++) {
					helpMessage += "\n" + helpArray[i];
				}
			}
			helpMessage += `\n--- Page (${page}/${Math.ceil((helpArray.length) / pageSize)}). © Nexint 2025. All Rights Reserved. ---`;
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