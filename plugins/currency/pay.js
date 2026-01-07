const { SlashCommandBuilder, MessageFlags, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { optOutIntChk } = require('../../functions/optOutIntChk.js');
const { balanceCheck } = require('../../functions/currency.js');
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
		.setName('pay')
		.setDescription('Pay a specific user.')
		.addUserOption(option =>
			option
				.setName('user')
				.setRequired(true)
				.setDescription('The person\'s balance to send to.'))
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
		const response = await interaction.deferReply({
			withResponse: true,
		});
		let guildMember = interaction.options.getUser("user");
		if (guildMember.id == interaction.user.id) {
			await interaction.editReply({
				content: "You can't send money to yourself.",
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
		let newBalanceUser = await balanceCheck(guildMember);
		let oldBalanceUser = await balanceCheck(interaction.user);
		let transfer;
		if (interaction.options.getInteger("zeros") === null) {
			transfer = interaction.options.getInteger("coins");
		} else {
			transfer = interaction.options.getInteger("coins") * Math.pow(10, interaction.options.getInteger("zeros"));
		}
		if (interaction.options.getString("all") === "true") {
			transfer = oldBalanceUser.value;
		}
		if (transfer === null || isNaN(transfer)) {
			transfer = 0;
		}
		if (transfer > oldBalanceUser.value) {
			await interaction.editReply({
				content: "You have insufficient funds to perform this action.",
				flags: MessageFlags.Ephemeral
			});
			return;
		}
		if (transfer <= 0) {
			await interaction.editReply({
				content: `Please give ${guildMember.displayName} a positive amount of money.`,
				flags: MessageFlags.Ephemeral
			});
			return;
		}
		const confirm = new ButtonBuilder()
			.setCustomId('confirm')
			.setLabel('Confirm')
			.setStyle(ButtonStyle.Success);

		const cancel = new ButtonBuilder()
			.setCustomId('cancel')
			.setLabel('Cancel')
			.setStyle(ButtonStyle.Secondary);

		const row = new ActionRowBuilder()
			.addComponents(cancel, confirm);
		await interaction.editReply({
			content: `Are you sure you want to send ${guildMember.username} ${(await abbrevBalance(transfer)).displayValue} coins?`,
			components: [row],
			withResponse: true,
		});

		const collectorFilter = i => i.user.id === interaction.user.id;
		try {
			const confirmation = await response.resource.message.awaitMessageComponent({ filter: collectorFilter, time: 30_000 });

			if (confirmation.customId === 'confirm') {
				oldBalanceUser.value -= transfer;
				newBalanceUser.value += transfer;
				await oldBalanceUser.save();
				await newBalanceUser.save();
				transfer = await abbrevBalance(transfer);
				let msg = `Gave ${newBalanceUser.name} ${transfer.displayValue} coins.\n\nYour new balance: ${(await abbrevBalance(oldBalanceUser.value)).displayValue} coins.\nTheir new balance: ${(await abbrevBalance(newBalanceUser.value)).displayValue} coins.`;
				if (devMode) {
					msg += "\n-# " + devMsg;
				}
				await confirmation.update({ content: msg, components: [] });
				let result = await dmNotify(guildMember, `${interaction.user.displayName} has sent you ${transfer.displayValue} coins in the channel ${response.resource.message.url}!\nYour new balance: ${(await abbrevBalance(newBalanceUser.value)).displayValue} coins.`, null, null, embedURL, embedIconURL, footerText, infoColor)
				if (result !== 0 && result.rawError.message != "Cannot send messages to this user") {
					throw result;
				}
			} else if (confirmation.customId === 'cancel') {
				await confirmation.update({ content: 'Payment cancelled.', components: [] });
			}
		} catch (error) {
			if (error.name == "Error [InteractionCollectorError]") {
				await interaction.editReply({ content: 'Confirmation not received within 30 seconds, cancelling', components: [] });
			} else {
				throw error;
			}
		}
	},
};