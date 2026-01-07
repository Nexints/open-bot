const { SlashCommandBuilder, MessageFlags } = require('discord.js');

const Sequelize = require('sequelize');

const fundb = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	// SQLite only
	storage: 'fundb.sqlite',
});

const notify = fundb.define('notify', {
	userId: {
		type: Sequelize.STRING,
	},
});

module.exports = {
	cooldown: 30,
	data: new SlashCommandBuilder()
		.setName('notify')
		.setDescription('Toggle notifications.')
		.addStringOption(option =>
			option
				.setName('opt-out')
				.setDescription('Opt out of notifications?')
				.setRequired(true)
				.addChoices(
					{ name: 'Yes', value: 'true' },
					{ name: 'No', value: 'false' },
				)),
	async execute(interaction) {
		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
		await interaction.deferReply({
			flags: MessageFlags.Ephemeral,
		});
		let msg;
		switch (interaction.options.getString("opt-out")) {
			case "true":
				try {
					await notify.create({
						userId: interaction.user.id,
					});
				} catch (error) {
					if (error.name === 'SequelizeUniqueConstraintError') {
						await interaction.editReply({ content: "Already opted out.", flags: MessageFlags.Ephemeral });
						return
					}
					throw error;
				}
				msg = 'You have opted out of notifications.'
				break;
			case "false":
				const rowCount = await notify.destroy({ where: { userId: interaction.user.id } })
				if (!rowCount) {
					await interaction.editReply({ content: "Already opted in.", flags: MessageFlags.Ephemeral });
					return
				}
				msg = 'You have opted into notifications.'
				break;
		}
		await interaction.editReply({
			content: msg,
			flags: MessageFlags.Ephemeral
		});
	},
};