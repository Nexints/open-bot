const { SlashCommandBuilder, MessageFlags } = require('discord.js');

const { version, versionID } = require('../../config.js');
const { latestVersion } = require('../../index.js');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('info')
		.setDescription('Information about this bot!'),
	async execute(interaction) {
		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
		let outputMsg;
		if (latestVersion > versionID) {
			outputMsg = `${latestVersion - versionID} commits behind.`;
		} else if (latestVersion == 0) {
			outputMsg = `The bot can't check for updates!`;
		} else if (latestVersion < versionID) {
			outputMsg = `${versionID - latestVersion} commits ahead.`;
		} else {
			outputMsg = `Running the latest version.`;
		}
		await interaction.reply({
			content: `OpenBot is an open-source all in one moderation bot!\nBot version: ${version} (Version ID: ${versionID}) / Latest version ID: ${latestVersion}.\n${outputMsg}`,
			flags: MessageFlags.Ephemeral
		});
	},
};