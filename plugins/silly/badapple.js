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
		.setName('badapple')
		.setDescription('Gives a youtube link to the Bad Apple song!'),
	async execute(interaction) {
		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
		const link = await links.findAll({});

		// See if moderation checks are required.
		let linkCheck = false;
		link.forEach(async links => {
			if (links.channelId == interaction.channel.id) {
				linkCheck = true;
			}
		})
		if(linkCheck){
			await interaction.reply({
				content: "Links are blocked in this channel.",
				flags: MessageFlags.Ephemeral
			});
			return;
		}
		await interaction.reply({
			content: "A YouTube link to Bad Apple - https://www.youtube.com/watch?v=FtutLA63Cp8\n-# This is a silly command, and will be removed on version 1.0."
		});
	},
};