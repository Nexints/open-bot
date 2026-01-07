const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');

const Sequelize = require('sequelize');
const { dmNotify } = require('../../functions/notify.js');

const { devID, tenorKey, embedURL, embedIconURL, footerText, infoColor } = require('../../config.js');

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	// SQLite only
	storage: 'database.sqlite',
});

const moderation = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	// SQLite only
	storage: 'moderation.sqlite',
});

const fundb = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	// SQLite only
	storage: 'fundb.sqlite',
});

const optOut = sequelize.define('optout', {
	author: {
		type: Sequelize.STRING,
		unique: true,
	}
});

const links = moderation.define('links', {
	channelId: {
		type: Sequelize.STRING,
		unique: true,
	},
});

const boop = fundb.define('boop', {
	userId: {
		type: Sequelize.STRING,
	},
	boopId: {
		type: Sequelize.STRING,
	},
	value: {
		type: Sequelize.INTEGER,
	},
});

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('boop')
		.setDescription('Boop someone!')
		.addUserOption(option =>
			option
				.setName('user')
				.setRequired(true)
				.setDescription('The person to boop :P'))
		.addBooleanOption(option =>
			option
				.setName('notify')
				.setDescription('Whether or not to notify the person. Defaults to true.')),
	async execute(interaction) {
		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
		if (tenorKey == "") {
			await interaction.reply({
				content: "The bot owner didn't set up an API key for tenor."
			});
			return;
		}
		let optedOut = false;
		const optOutList = await optOut.findAll({ attributes: ['author'] });
		optOutList.forEach(optOutID => {
			if (optOutID.author == interaction.user.id || optOutID.author == interaction.options.getUser("user").id) {
				optedOut = true;
			}
		})
		const tenorSearch = await fetch("https://tenor.googleapis.com/v2/search?q=" + "anime poke" + "&key=" + tenorKey + "&client_key=" + "DiscordBot" + "&limit=" + 1 + "&random=" + true);
		const results = await tenorSearch.json();
		const url = results.results[0].media_formats.gif.url;
		let findboop;
		let description = `One of you has opted out of data collection.`;
		if (!optedOut) {
			findboop = await boop.findOne({
				where: {
					userId: interaction.user.id,
					boopId: interaction.options.getUser("user").id
				}
			});
			if (findboop === null) {
				await boop.create({
					userId: interaction.user.id,
					boopId: interaction.options.getUser("user").id,
					value: 1
				});
				findboop = await boop.findOne({
					where: {
						userId: interaction.user.id,
						boopId: interaction.options.getUser("user").id
					}
				});
			} else {
				findboop.value += 1;
				await findboop.save();
			}
			description = `${interaction.user.displayName} has booped ${interaction.options.getUser("user").displayName} ${findboop.value} time(s)!`;
		}
		const helloEmbed = new EmbedBuilder()
			.setColor(infoColor)
			.setTitle(`${interaction.user.displayName} boops ${interaction.options.getUser("user").displayName}!`)
			.setURL(results.results[0].itemurl)
			//.setAuthor({ name: 'Moderation Event', iconURL: embedIconURL, url: embedURL })
			.setDescription(description)
			.setThumbnail(embedURL)
			// .addFields({ name: 'This message has been deleted: ', value: `\`${msg.cleanContent}\``, inline: true })
			.setImage(url)
			.setTimestamp()
			.setFooter({ text: footerText, iconURL: embedIconURL });
		const embedMessage = await interaction.reply({
			embeds: [helloEmbed], withResponse: true
		});
		let notify = interaction.options.getBoolean("notify");
		if (notify == null) {
			notify = true;
		}
		if (notify) {
			await dmNotify(interaction.options.getUser("user"), `${interaction.user.displayName} booped you in the channel ${embedMessage.resource.message.url}!`, url, results.results[0].itemurl, null, embedIconURL, footerText, infoColor);
		}
	},
};