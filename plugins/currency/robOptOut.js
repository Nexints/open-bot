const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { optOutIntChk } = require('../../functions/optOutIntChk.js');
const { balanceCheck, expGain, miscCheck } = require('../../functions/currency.js');
const { abbrevBalance } = require('../../functions/abbrevValues.js');
const { dmNotify } = require('../../functions/notify.js');
const { embedURL, embedIconURL, footerText, infoColor, devMode, devID, devMsg } = require('../../config.js');

const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	// SQLite only
	storage: 'database.sqlite',
});

const currency = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	// SQLite only
	storage: 'currency.sqlite',
});

module.exports = {
	cooldown: 86400,
	data: new SlashCommandBuilder()
		.setName('steal-toggle')
		.setDescription('Toggle opt in or opt out of being robbed.')
		.addStringOption(option =>
			option
				.setName('opt-out')
				.setDescription('Opt out of robbing?')
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
		let guildMember = interaction.user;
		let value = await optOutIntChk(guildMember);
		if (value == -1) {
			await interaction.editReply({
				content: "You are opted out. Balance commands will not work.",
				flags: MessageFlags.Ephemeral
			});
			return;
		}
		let miscUser = await miscCheck(guildMember);
		let msg;
		switch (interaction.options.getString("opt-out")) {
			case "true":
				miscUser.robbable = false;
				msg = 'You have opted out of being robbed.\n-# Note that you cannot rob others.'
				break;
			case "false":
				miscUser.robbable = true;
				msg = 'You have opted into being robbed.\n-# You can now be robbed.'
				break;
		}
		miscUser.save();
		await interaction.editReply({
			content: msg,
			flags: MessageFlags.Ephemeral
		});
		let result = await dmNotify(guildMember, msg, null, null, embedURL, embedIconURL, footerText, infoColor);
		if (result !== 0 && result.rawError.message != "Cannot send messages to this user") {
			throw result;
		}
	},
};