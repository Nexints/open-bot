const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { optOutIntChk } = require('../../functions/optOutIntChk.js');
const { balanceCheck, miscCheck, expGain } = require('../../functions/currency.js');
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

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
	cooldown: 30,
	data: new SlashCommandBuilder()
		.setName('steal')
		.setDescription('Steal someone\'s coins. Costs 100 coins to attempt to steal.')
		.addUserOption(option =>
			option
				.setName('user')
				.setRequired(true)
				.setDescription('The person to steal from.')),
	async execute(interaction) {
		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
		let guildMember = interaction.options.getUser("user");
		await interaction.deferReply();
		if (guildMember.id == interaction.user.id) {
			await interaction.editReply({
				content: "You can't steal from yourself.",
				flags: MessageFlags.Ephemeral
			});
			return;
		}
		let value = await optOutIntChk(guildMember);
		if (value == -1) {
			await interaction.editReply({
				content: "This person is opted out. Balance commands will not work.",
				flags: MessageFlags.Ephemeral
			});
			return;
		}
		value = await optOutIntChk(interaction.user);
		if (value == -1) {
			await interaction.editReply({
				content: "You are opted out. Balance commands will not work.",
				flags: MessageFlags.Ephemeral
			});
			return;
		}
		let balanceUser = await balanceCheck(interaction.user);
		let balanceRobbed = await balanceCheck(guildMember);
		let miscRobbed = await miscCheck(guildMember);
		let rng = Math.random();
		if (balanceRobbed.value == 0) {
			await interaction.editReply({
				content: "You can't steal from anyone who has 0 coins.",
				flags: MessageFlags.Ephemeral
			});
			return;
		}
		if (Math.floor(Date.now() / 1000) - miscRobbed.lastRobbed < 86400) {
			let nextSteal = Number(miscRobbed.lastRobbed) + 86400;
			await interaction.editReply({
				content: `This user has already been stolen from in the past day. You may rob them again <t:${nextSteal}:R>.`,
				flags: MessageFlags.Ephemeral
			});
			return;
		}
		if (balanceUser.value < 100) {
			await interaction.editReply({
				content: "You have insufficient funds to perform this action.",
				flags: MessageFlags.Ephemeral
			});
			return;
		}
		if ((await miscCheck(interaction.user)).robbable == false) {
			await interaction.editReply({
				content: `You have opted out from being robbed. This command does not work for you.`,
				flags: MessageFlags.Ephemeral
			});
			return;
		}
		if (miscRobbed.robbable == false) {
			await interaction.editReply({
				content: `This user has opted out from being robbed.`,
				flags: MessageFlags.Ephemeral
			});
			return;
		}
		balanceUser.value -= 100;
		miscRobbed.lastRobbed = Math.floor(Date.now() / 1000);
		await miscRobbed.save();
		await interaction.editReply({
			content: `Robbing ${guildMember.displayName}...`
		});
		await delay(1000);
		let addedCoins = 0;
		let msg;
		if (rng < 0.5) {
			balanceRobbed.value += 100;
			await balanceUser.save();
			await balanceRobbed.save();
			msg = `You tried stealing from ${guildMember.displayName}, but failed. They will be notified of your attempt.`
		} else if (rng < 0.9) {
			addedCoins = Math.floor(balanceRobbed.value / (4 + (Math.random() * 6))); // 10-25% of money gone lol
			balanceUser.value += addedCoins + 100;
			balanceRobbed.value -= addedCoins;
			await balanceUser.save();
			await balanceRobbed.save();
			msg = `You stole from ${guildMember.displayName} and made ${(await abbrevBalance(addedCoins)).displayValue} coins.\n\nYour new balance: ${(await abbrevBalance(balanceUser.value)).displayValue} coins.`
		} else {
			addedCoins = balanceRobbed.value; // ALL OF UR MONEY GONE LOL
			balanceUser.value += addedCoins + 100;
			balanceRobbed.value -= addedCoins;
			await balanceUser.save();
			await balanceRobbed.save();
			msg = `You stole ALL OF ${guildMember.displayName} COINS LOL and made ${(await abbrevBalance(addedCoins)).displayValue} coins.\n\nYour new balance: ${(await abbrevBalance(balanceUser.value)).displayValue} coins.`
		}
		let level = await expGain();
		if (level > 0) {
			msg += `\n\nYou gained an additional level! Your level is now ${level}`;
		}
		if (devMode) {
			msg += "\n-# " + devMsg;
		}
		msg += "\n-# Legal disclaimer: **I do not endorse actual crimes.**";
		const response = await interaction.editReply({
			content: msg,
			withReply: true
		});
		let coins = await abbrevBalance(addedCoins);
		let result;
		if (coins.value == 0) {
			result = await dmNotify(guildMember, `${interaction.user.displayName} tried robbing you in the channel ${response.url}, but failed.\nYour new balance: ${(await abbrevBalance(balanceRobbed.value)).displayValue} coins.`, null, null, embedURL, embedIconURL, footerText, infoColor);
		} else {
			result = await dmNotify(guildMember, `${interaction.user.displayName} has robbed you of ${coins.displayValue} coins in the channel ${response.url}.\nYour new balance: ${(await abbrevBalance(balanceRobbed.value)).displayValue} coins.`, null, null, embedURL, embedIconURL, footerText, infoColor);
		}
		if (result !== 0 && result.rawError.message != "Cannot send messages to this user") {
			throw result;
		}
	},
};