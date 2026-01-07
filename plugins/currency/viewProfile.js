const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { optOutIntChk } = require('../../functions/optOutIntChk.js');
const { balanceCheck, bankCheck, miscCheck, workCheck } = require('../../functions/currency.js');
const { abbrevBalance } = require('../../functions/abbrevValues.js');
const { jobs } = require('./config.js')
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
		.setName('profile')
		.setDescription('Views the profile of anyone.')
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
		let miscUser = await miscCheck(guildMember);
		balanceUser = await abbrevBalance(balanceUser.value);
		let workUser = await workCheck(guildMember);
		let msg = `${guildMember.displayName}'s profile:`;
		if (guildMember.id == interaction.user.id) {
			msg = `Your profile:`;
		}
		let robbable = "❌";
		if (Number(miscUser.lastRobbed) + 86400 < Math.floor(Date.now() / 1000)) {
			robbable = "✅";
		};
		if(miscUser.robbable == false){
			robbable = "❌";
		}
		msg += `\nLevel: ${miscUser.level} (${miscUser.exp} exp / ${miscUser.nextLevel})`
		msg += `\nBalance: ${balanceUser.displayValue} coins.`;
		msg += `\nBank Balance: ${bankBalanceUser.displayValue} / ${(await abbrevBalance((await bankCheck(guildMember)).maxValue)).displayValue} coins.`;
		if (workUser.jobId == -1) {
			msg += `\nThis person does not have a job.`
		} else {
			msg += `\nJob: ${jobs[workUser.jobId].name} (Worked ${workUser.workCount} times)`
			msg += `\n-#  (Idea from ${jobs[workUser.jobId].credit})`
			msg += `\nWage: ${(await abbrevBalance(workUser.wage)).displayValue} (+-20%)`;
		}
		msg += `\nRobbable? ${robbable}`;
		if (devMode) {
			msg += "\n-# " + devMsg;
		}
		await interaction.editReply({
			content: msg
		});
	},
};