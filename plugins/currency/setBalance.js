const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { optOutIntChk } = require('../../functions/optOutIntChk.js');
const { balanceCheck } = require('../../functions/currency.js');
const { abbrevBalance } = require('../../functions/abbrevValues.js');
const { devMode, devID, devMsg, devGuild } = require('../../config.js');

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
		.setName('setbal')
		.setDescription('Sets the balance of a specific user. Dev only.')
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('The person\'s balance to reset. Defaults to yourself.'))
		.addIntegerOption(option =>
			option
				.setName('coins')
				.setDescription('The coin amount. Defaults to 0.'))
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
		await interaction.deferReply();
		if (!devMode) {
			await interaction.editReply({
				content: "Dev mode is turned off. This command does not work.",
				flags: MessageFlags.Ephemeral
			});
			return;
		}
		if (interaction.guild.id != devGuild) {
			await interaction.editReply({
				content: "You are not the developer of this bot. This incident will be reported.",
				flags: MessageFlags.Ephemeral
			});
			return;
		}
		let guildMember = interaction.options.getUser("user");
		if (guildMember === null) {
			guildMember = interaction.user
		}
		let value = await optOutIntChk(guildMember);
		if (value == -1) {
			await interaction.editReply({
				content: "This person is opted out. Balance checks will not work.",
				flags: MessageFlags.Ephemeral
			});
			return;
		}
		let balanceUser = await balanceCheck(guildMember);
		let newBal = interaction.options.getInteger("coins");
		if (newBal === null) {
			newBal = 0;
		}
		balanceUser.value = newBal;
		await balanceUser.save();
		newBal = await abbrevBalance(newBal);
		let msg = `Set ${balanceUser.name}'s balance to ${newBal.displayValue} coins.`;
		if (guildMember.id == interaction.user.id) {
			msg = `Set your balance to ${newBal.displayValue} coins.`;
		}
		if (devMode) {
			msg += "\n-# " + devMsg;
		}
		await interaction.editReply({
			content: msg
		});
	},
};