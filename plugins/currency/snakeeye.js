const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { optOutIntChk } = require('../../functions/optOutIntChk.js');
const { balanceCheck, expGain } = require('../../functions/currency.js');
const { abbrevBalance } = require('../../functions/abbrevValues.js');
const { devMode, devID, devMsg, prodMultiplier, devMultiplier } = require('../../config.js');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
	cooldown: 30,
	data: new SlashCommandBuilder()
		.setName('snakeeye')
		.setDescription('Snake eyes minigame - with TERRIBLE odds.')
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
		let rng = Math.ceil(Math.random() * 6);
		let rng2 = Math.ceil(Math.random() * 6);
		if (rng < 2 && rng2 < 2) {
			addedCoins = addedCoins * 9;
		} else if (rng != rng2) {
			addedCoins = addedCoins * -1;
		}
		balanceUser.value += addedCoins;
		await balanceUser.save();

		// artificial delay to make it look interesting
		for (let i = 0; i < 5; i++) {
			await interaction.editReply({
				content: `Rolling...\n[${Math.ceil(Math.random() * 6)}] [${Math.ceil(Math.random() * 6)}]`
			});
			await delay(1000);
		}
		addedCoins = await abbrevBalance(addedCoins);
		let newCoinAmt = await abbrevBalance(balanceUser.value);
		let msg = `You rolled [${rng}] [${rng2}], and made back ${addedCoins.displayValue} coins.\n\nYour updated balance: ${newCoinAmt.displayValue} coins.`
		if (addedCoins.value < 0) {
			msg = `You rolled [${rng}] [${rng2}], and lost ${(await abbrevBalance(addedCoins.value * -1)).displayValue} coins.\n\nYour updated balance: ${newCoinAmt.displayValue} coins.`
		}
		let level = await expGain(guildMember);
		if (level > 0) {
			msg += `\n\nYou gained an additional level! Your level is now ${level}`;
		}
		if (devMode) {
			msg += "\n-# " + devMsg;
		}
		msg += "\n-# Legal disclaimer: **I do not endorse underage gambling.**";
		await interaction.editReply({
			content: msg
		});
	},
};