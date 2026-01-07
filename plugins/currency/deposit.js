const { SlashCommandBuilder, MessageFlags, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { optOutIntChk } = require('../../functions/optOutIntChk.js');
const { balanceCheck, bankCheck } = require('../../functions/currency.js');
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
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('deposit')
		.setDescription('Deposit a specific amount into the bank.')
		.addIntegerOption(option =>
			option
				.setName('coins')
				.setDescription('The coin amount to transfer.'))
		.addIntegerOption(option =>
			option
				.setName('zeros')
				.setDescription('The amount of zeroes behind.'))
		.addStringOption(option =>
			option
				.setName('all')
				.setDescription('Deposit all coins?')
				.addChoices(
					{ name: 'True', value: 'true' },
				)),
	async execute(interaction) {
		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
		let value = await optOutIntChk(interaction.user);
		await interaction.deferReply();
		if (value == -1) {
			await interaction.editReply({
				content: "You are opted out. Balance commands will not work.",
				flags: MessageFlags.Ephemeral
			});
			return;
		}
		let userBalance = await balanceCheck(interaction.user);
		let bankBalance = await bankCheck(interaction.user);
		let transfer;
		if (interaction.options.getInteger("zeros") === null) {
			transfer = interaction.options.getInteger("coins");
		} else {
			transfer = interaction.options.getInteger("coins") * Math.pow(10, interaction.options.getInteger("zeros"));
		}
		if (interaction.options.getString("all") === "true") {
			transfer = userBalance.value;
		}
		if (transfer === null || isNaN(transfer)) {
			transfer = 0;
		}
		if (transfer > userBalance.value) {
			await interaction.editReply({
				content: "You have insufficient funds to perform this action.",
				flags: MessageFlags.Ephemeral
			});
			return;
		}
		if (transfer > bankBalance.maxValue - bankBalance.value) {
			transfer = bankBalance.maxValue - bankBalance.value;
		}
		if(transfer < 0){
			await interaction.editReply({
				content: "You can't deposit less than 0 coins.",
				flags: MessageFlags.Ephemeral
			});
			return;
		}
		userBalance.value -= transfer;
		bankBalance.value += transfer;
		await userBalance.save();
		await bankBalance.save();
		transfer = await abbrevBalance(transfer);
		let msg = `Deposited ${transfer.displayValue} coins into the bank.\n\nNew balance: ${(await abbrevBalance(userBalance.value)).displayValue} coins.\nNew bank balance: ${(await abbrevBalance(bankBalance.value)).displayValue} coins.`;
		if (devMode) {
			msg += "\n-# " + devMsg;
		}
		await interaction.editReply({
			content: msg
		});
	},
};