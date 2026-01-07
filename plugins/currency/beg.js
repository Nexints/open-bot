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

module.exports = {
	cooldown: 30,
	data: new SlashCommandBuilder()
		.setName('beg')
		.setDescription('Beg to gain money for the balance system. Cooldown of 30 seconds.'),
	async execute(interaction) {
		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
		await interaction.deferReply();
		let guildMember = interaction.user;
		let value = await optOutIntChk(guildMember);
		if (value == -1) {
			await interaction.editReply({
				content: "You are opted out. Balance commands will not work.",
				flags: MessageFlags.Ephemeral
			});
			return;
		}
		let balanceUser = await balanceCheck(guildMember);
		let rng = Math.random();
		let addedCoins;
		if (rng < 0.1) {
			addedCoins = 0;
		} else if (rng > 0.95) {
			addedCoins = 5000 + Math.round(Math.random() * 10000);
		} else {
			addedCoins = 500 + Math.round(Math.random() * 1000);
		}
		if (devMode) {
			addedCoins = addedCoins * devMultiplier // conversion factor (how much more money it makes)
		} else {
			addedCoins = addedCoins * prodMultiplier // conversion factor (how much more money it makes) - production setting
		}
		if (balanceUser.multiplier !== null) {
			addedCoins = addedCoins * balanceUser.multiplier
		}
		balanceUser.value += addedCoins;
		await balanceUser.save();
		addedCoins = await abbrevBalance(addedCoins);
		let newCoinAmt = await abbrevBalance(balanceUser.value);
		let msg = `You decided to beg and got ${addedCoins.displayValue} coins.\n\nYour updated balance: ${newCoinAmt.displayValue} coins.`;
		if (addedCoins.value == 0) {
			msg = `You decided to beg, but got ABSOLUTELY NOTHING BOZO.\n\nYour updated balance: ${newCoinAmt.displayValue} coins.`
		} else if (rng > 0.95) {
			msg = `You decided to beg and got a massive tip from a rich person, resulting in ${addedCoins.displayValue} coins.\n\nYour updated balance: ${newCoinAmt.displayValue} coins.`
		}
		let level = await expGain(guildMember);
		if(level > 0){
			msg += `\n\nYou gained an additional level! Your level is now ${level}`;
		}
		if (devMode) {
			msg += "\n-# " + devMsg;
		}
		await interaction.editReply({
			content: msg
		});
	},
};