const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { optOutIntChk } = require('../../functions/optOutIntChk.js');
const { balanceCheck, bankCheck } = require('../../functions/currency.js');
const { abbrevBalance } = require('../../functions/abbrevValues.js');
const { devMode, devID, devMsg } = require('../../config.js');

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
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('bal')
		.setDescription('Views balance of anyone.')
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('The person\'s balance to check. Defaults to yourself.')),
	async execute(interaction) {
		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
		let guildMember = interaction.options.getUser("user");
		await interaction.deferReply();
		if (guildMember === null) {
			guildMember = interaction.user
		}
		let value = await optOutIntChk(guildMember);
		if (value == -1) {
			await interaction.editReply({
				content: "This person is opted out. Balance commands will not work.",
				flags: MessageFlags.Ephemeral
			});
			return;
		}
		let balanceUser = await balanceCheck(guildMember);
		let bankBalanceUser = await abbrevBalance((await bankCheck(guildMember)).value);
		balanceUser = await abbrevBalance(balanceUser.value);
		let msg = `${guildMember.displayName}'s balance: ${balanceUser.displayValue} coins.\nTheir bank balance: ${bankBalanceUser.displayValue} / ${(await abbrevBalance((await bankCheck(guildMember)).maxValue)).displayValue} coins.`;
		if (guildMember.id == interaction.user.id) {
			msg = `Your balance: ${balanceUser.displayValue} coins.\nYour bank balance: ${bankBalanceUser.displayValue} / ${(await abbrevBalance((await bankCheck(guildMember)).maxValue)).displayValue} coins.`;
		}
		if (devMode) {
			msg += "\n-# " + devMsg;
		}
		await interaction.editReply({
			content: msg
		});
	},
};