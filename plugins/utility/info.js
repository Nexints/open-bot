const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('info')
		.setDescription('Information about this bot!'),
	async execute(interaction) {
		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
		await interaction.reply({
            content: "This bot is an open source all in one moderation bot!",
            flags: MessageFlags.Ephemeral
        });
	},
};