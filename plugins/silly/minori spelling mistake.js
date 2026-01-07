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
		.setName('minori')
		.setDescription('Minori spelling mistake.'),
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
			content: "https://tenor.com/view/minori-hanasato-minori-pjsk-more-more-jump-project-sekai-pjsk-gif-10970315925687936087\n-# This is a silly command, and will be toggleable shortly."
		});
	},
};