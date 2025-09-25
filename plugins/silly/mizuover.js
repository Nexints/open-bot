const { SlashCommandBuilder, MessageFlags } = require('discord.js');

const Sequelize = require('sequelize');

const moderation = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	// SQLite only
	storage: 'moderation.sqlite',
});

const links = moderation.define('links', {
	channelId: {
		type: Sequelize.STRING,
		unique: true,
	},
});

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('mizuover')
		.setDescription('It\'s mizuover.'),
	async execute(interaction) {
		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
		await interaction.reply({
			content: "It's so mizuover. **1003.**\n\nAkiyama Mizuki (暁山 瑞希) is a second year student at Kamiyama High School. They are the animator of the online music circle 25-ji, Nightcord de., going by the alias \"Amia\".\n-# This is a silly command, and will be removed on version 1.0."
		});
	},
};