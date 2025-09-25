const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');

const Sequelize = require('sequelize');

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

const hello = fundb.define('hello', {
	userId: {
		type: Sequelize.STRING,
	},
	helloId: {
		type: Sequelize.STRING,
	},
});

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('hello')
		.setDescription('Say hello to someone!')
		.addUserOption(option =>
			option
				.setName('user')
				.setRequired(true)
				.setDescription('The person to say hello to :P'))
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
		const tenorSearch = await fetch("https://tenor.googleapis.com/v2/search?q=" + "anime greeting hello" + "&key=" + tenorKey + "&client_key=" + "DiscordBot" + "&limit=" + 1 + "&random=" + true);
		const results = await tenorSearch.json();
		const url = results.results[0].media_formats.gif.url;
		let findhello;
		let description = `One of you has opted out of data collection.`;
		if (!optedOut) {
			findhello = await hello.findAll({
				where: {
					userId: interaction.user.id,
					helloId: interaction.options.getUser("user").id
				}
			});
			await hello.create({
				userId: interaction.user.id,
				helloId: interaction.options.getUser("user").id
			});
			description = `${interaction.user.displayName} has said hello to ${interaction.options.getUser("user").displayName} ${findhello.length + 1} time(s)!`;
		}
		const helloEmbed = new EmbedBuilder()
			.setColor(infoColor)
			.setTitle(`${interaction.user.displayName} says hello to ${interaction.options.getUser("user").displayName}!`)
			.setURL(results.results[0].itemurl)
			//.setAuthor({ name: 'Moderation Event', iconURL: embedIconURL, url: embedURL })
			.setDescription(description)
			.setThumbnail(embedURL)
			// .addFields({ name: 'This message has been deleted: ', value: `\`${msg.cleanContent}\``, inline: true })
			.setImage(url)
			.setTimestamp()
			.setFooter({ text: footerText, iconURL: embedIconURL });
		const embedMessage = await interaction.reply({
			embeds: [helloEmbed], fetchReply : true
		});
		let notify = interaction.options.getBoolean("notify");
		if (notify == null) {
			notify = true;
		}
		if (notify) {
			const dmNotif = new EmbedBuilder()
				.setColor(infoColor)
				.setTitle(`Notification!`)
				.setURL(results.results[0].itemurl)
				//.setAuthor({ name: 'Moderation Event', iconURL: embedIconURL, url: embedURL })
				.setDescription(`${interaction.user.displayName} said hello to you in the channel ${embedMessage.url}!` + "\n-# Turn notifs off with /notify!")
				.setThumbnail(embedURL)
				// .addFields({ name: 'This message has been deleted: ', value: `\`${msg.cleanContent}\``, inline: true })
				.setImage(url)
				.setTimestamp()
				.setFooter({ text: footerText, iconURL: embedIconURL });
			await interaction.options.getUser("user").send({
				embeds: [dmNotif]
			});
		}
	},
};