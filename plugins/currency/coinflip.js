const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { optOutIntChk } = require('../../functions/optOutIntChk.js');
const { balanceCheck, expGain } = require('../../functions/currency.js');
const { abbrevBalance } = require('../../functions/abbrevValues.js');
const { devMode, devID, devMsg, prodMultiplier, devMultiplier } = require('../../config.js');

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

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
	cooldown: 30,
	data: new SlashCommandBuilder()
		.setName('coinflip')
		.setDescription('Coinflip (with REALLY terrible odds).')
		.addIntegerOption(option =>
			option
				.setName('coins')
				.setDescription('The coin amount.'))
		.addIntegerOption(option =>
			option
				.setName('zeros')
				.setDescription('The amount of zeroes behind.'))
		.addStringOption(option =>
			option
				.setName('all')
				.setDescription('Coinflip all coins?')
				.addChoices(
					{ name: 'True', value: 'true' },
				)),
	async execute(interaction) {
		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
		let guildMember = interaction.user;
		await interaction.deferReply();
		let value = await optOutIntChk(guildMember);
		if (value == -1) {
			await interaction.editReply({
				content: "This person is opted out. Balance checks will not work.",
				flags: MessageFlags.Ephemeral
			});
			return;
		}
		let balanceUser = await balanceCheck(guildMember);
		let addedCoins;
		if (interaction.options.getInteger("zeros") === null) {
			addedCoins = interaction.options.getInteger("coins");
		} else {
			addedCoins = interaction.options.getInteger("coins") * Math.pow(10, interaction.options.getInteger("zeros"));
		}
		if (interaction.options.getString("all") === "true") {
			addedCoins = balanceUser.value;
		}
		if (addedCoins === null || isNaN(addedCoins)) {
			addedCoins = 0;
		}
		let rng = Math.random();
		if (addedCoins <= 0) {
			await interaction.editReply({
				content: "Coin value must be positive.",
				flags: MessageFlags.Ephemeral
			});
			return;
		}
		if (addedCoins > balanceUser.value) {
			await interaction.editReply({
				content: "You have insufficient funds to perform this action.",
				flags: MessageFlags.Ephemeral
			});
			return;
		}

		// coinflip logic
		if (rng < 0.5) {
			addedCoins = addedCoins * -1
		}
		balanceUser.value += addedCoins;
		await balanceUser.save();

		// artificial delay to make it look interesting
		await interaction.editReply({
			content: `Coinflipping ${(await abbrevBalance(Math.abs(addedCoins))).displayValue} coins.`
		});
		await delay(1000);
		await interaction.editReply({
			content: `Coinflipping ${(await abbrevBalance(Math.abs(addedCoins))).displayValue} coins..`
		});
		await delay(1000);
		await interaction.editReply({
			content: `Coinflipping ${(await abbrevBalance(Math.abs(addedCoins))).displayValue} coins...`
		});
		await delay(1000);
		addedCoins = await abbrevBalance(addedCoins);
		let newCoinAmt = await abbrevBalance(balanceUser.value);
		let msg = `You decided to coinflip ${addedCoins.displayValue} coins, and made it back.\n\nYour updated balance: ${newCoinAmt.displayValue} coins.`
		if (addedCoins.value < 0) {
			msg = `You decided to coinflip ${(await abbrevBalance(addedCoins.value * -1)).displayValue} coins, but lost it all.\n\nYour updated balance: ${newCoinAmt.displayValue} coins.`
		}
		let level = await expGain(guildMember);
		if(level > 0){
			msg += `\n\nYou gained an additional level! Your level is now ${level}`;
		}
		if (devMode) {
			msg += "\n-# " + devMsg;
		}
		msg += "\n-# Legal disclaimer: **I do not endorse underage gambling. Coinflip responsibly.**";
		await interaction.editReply({
			content: msg
		});
	},
};