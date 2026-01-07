const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { optOutIntChk } = require('../../functions/optOutIntChk.js');
const { balanceCheck, workCheck, expGain } = require('../../functions/currency.js');
const { abbrevBalance } = require('../../functions/abbrevValues.js');
const { dmNotify } = require('../../functions/notify.js');
const { jobs, choiceCount } = require('./config.js')
const { devMode, devID, devMsg, prodMultiplier, devMultiplier, embedURL, embedIconURL, footerText, infoColor } = require('../../config.js');

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
		.setName('work')
		.setDescription('Work to gain money for the balance system. Cooldown of 30 seconds.'),
	async execute(interaction) {
		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
		const embedMessage = await interaction.deferReply({
			withResponse: true,
		});
		let guildMember = interaction.user;
		let value = await optOutIntChk(guildMember);
		if (value == -1) {
			await interaction.editReply({
				content: "This person is opted out. Balance commands will not work.",
				flags: MessageFlags.Ephemeral
			});
			return;
		}
		let balanceUser = await balanceCheck(guildMember);
		let workUser = await workCheck(guildMember);
		if (workUser.jobId == -1) {
			await interaction.editReply({
				content: "You do not have a job. Please apply for one with /apply!"
			});
			return;
		}
		if (Math.floor(Date.now() / 1000) - Number(workUser.lastWorked) >= jobs[workUser.jobId].maxDays * 24 * 60 * 60) {
			workUser.jobId = -1;
			workUser.lastWorked = 0;
			workUser.wage = 0;
			await workUser.save();
			await interaction.editReply({
				content: "You have been fired. Please apply for a new job with /apply!", withResponse: true
			});
			let result = await dmNotify(guildMember, `You have now been fired in the channel ${embedMessage.resource.message.url}!`, null, null, embedURL, embedIconURL, footerText, infoColor);
			if (result !== 0 && result.rawError.message != "Cannot send messages to this user") {
				throw result;
			}
			return;
		}
		let rng = Math.random();
		workUser.workCount += 1;
		let addedCoins = workUser.wage * (0.9 + (rng / 5));
		if (workUser.workCount % jobs[workUser.jobId].promo == 0) {
			workUser.wage *= jobs[workUser.jobId].promoAmount;
		}
		if (devMode) {
			addedCoins = addedCoins * devMultiplier // conversion factor (how much more money it makes)
		} else {
			addedCoins = addedCoins * prodMultiplier // conversion factor (how much more money it makes) - production setting
		}
		if (balanceUser.multiplier !== null) {
			addedCoins = addedCoins * balanceUser.multiplier
		}
		workUser.lastWorked = Math.floor(Date.now() / 1000);
		balanceUser.value += addedCoins;
		await balanceUser.save();
		await workUser.save();
		addedCoins = await abbrevBalance(addedCoins);
		let newCoinAmt = await abbrevBalance(balanceUser.value);
		let msg = `You decided to work at your job and got ${addedCoins.displayValue} coins.\n\nYour updated balance: ${newCoinAmt.displayValue} coins.`;
		if (workUser.workCount % jobs[workUser.jobId].promo == 0) {
			msg += `\n\nYou got a raise from working so hard! Your balance has increased by ${jobs[workUser.jobId].promoAmount}x.`
		}
		let level = await expGain(guildMember);
		if (level > 0) {
			msg += `\n\nYou gained an additional level! Your level is now ${level}`;
		}
		if (devMode) {
			msg += "\n-# " + devMsg;
		}
		await interaction.editReply({
			content: msg,
			withResponse: true,
		});

		if (workUser.workCount % jobs[workUser.jobId].promo == 0) {
			await dmNotify(guildMember, `You have been promoted at your job in the channel ${embedMessage.resource.message.url}!\nNew Salary: ${(await abbrevBalance(workUser.wage)).displayValue} coins.`, null, null, embedURL, embedIconURL, footerText, infoColor);
		}
	},
};