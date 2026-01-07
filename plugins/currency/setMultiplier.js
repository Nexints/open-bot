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
		.setName('setmulti')
		.setDescription('Sets the global multiplier for a person. Dev only.')
		.addNumberOption(option =>
			option
				.setName('multiplier')
				.setRequired(true)
				.setDescription('The multiplier'))
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('The person\'s multiplier to set. Defaults to yourself.'))
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
		balanceUser.multiplier = interaction.options.getNumber("multiplier");
		await balanceUser.save();
		let multiplier = await abbrevBalance(balanceUser.multiplier);
		let msg = `Set ${balanceUser.name}'s multiplier to ${multiplier.displayValue}.`;
		if (guildMember.id == interaction.user.id) {
			msg = `Set your multiplier to ${multiplier.displayValue}.`
		}
		if (devMode) {
			msg += "\n-# " + devMsg;
		}
		await interaction.editReply({
			content: msg
		});
	},
};