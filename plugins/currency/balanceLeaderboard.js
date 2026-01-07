const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { optOutIntChk } = require('../../functions/optOutIntChk.js');
const { balanceCheck } = require('../../functions/currency.js');
const { abbrevBalance } = require('../../functions/abbrevValues.js');

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

// Databases used.
const balance = currency.define('balance', {
	userId: {
		type: Sequelize.STRING,
	},
	name: {
		type: Sequelize.STRING,
	},
	value: {
		type: Sequelize.DOUBLE,
	},
	multiplier: {
		type: Sequelize.DOUBLE,
	}
});

const bank = currency.define('bank', {
	userId: {
		type: Sequelize.STRING,
	},
	name: {
		type: Sequelize.STRING,
	},
	value: {
		type: Sequelize.DOUBLE,
	},
	maxValue: {
		type: Sequelize.DOUBLE,
	}
});

const miscinfo = currency.define('miscinfo', {
	userId: {
		type: Sequelize.STRING,
	},
	name: {
		type: Sequelize.STRING,
	},
	exp: {
		type: Sequelize.DOUBLE,
	},
});

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('baltop')
		.setDescription('Views balance of the top people, globally.')
		.addStringOption(option =>
			option.setName('leaderboard')
				.setDescription('The leaderboard to view.')
				.setRequired(true)
				.addChoices(
					{ name: 'Wallet', value: 'Wallet' },
					{ name: 'Bank', value: 'Bank' },
				))
		.addBooleanOption(option =>
			option.setName('short')
				.setDescription('Shortened numbers? Defaults to true.')),
	async execute(interaction) {
		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
		await interaction.deferReply();
		let lbMsg = interaction.options.getString("leaderboard") + " leaderboard:";
		let lb;
		switch (interaction.options.getString("leaderboard")) {
			case "Wallet":
				lb = await balance.findAll({
					order: [
						['value', 'DESC'],
					],
					limit: 10
				})
				break;
			case "Bank":
				lb = await bank.findAll({
					order: [
						['value', 'DESC'],
					],
					limit: 10
				})
				break;
		}
		if (lb.length == 0) {
			lbMsg += + "\nNo leaderboard at the moment for this category."
			lbMsg += + "\n-# Coded by Nexint. © All Rights Reserved."
			await interaction.editReply({
				content: lbMsg
			});
			return;
		}
		let shortened = interaction.options.getBoolean("short");
		if (shortened === null) {
			shortened = true;
		}
		for (let i = 0; i < lb.length; i++) {
			let coins = await abbrevBalance(lb[i].value)
			if (shortened) {
				lbMsg += `\n#${i + 1}: \`${lb[i].name}\` (${coins.displayValue} coins)`
			} else {
				lbMsg += `\n#${i + 1}: \`${lb[i].name}\` (${coins.value} coins)`
			}
		}
		lbMsg += "\n-# Coded by Nexint. © All Rights Reserved."
		await interaction.editReply({
			content: lbMsg
		});
	},
};