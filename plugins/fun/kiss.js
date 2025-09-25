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

const kiss = fundb.define('kiss', {
	userId: {
		type: Sequelize.STRING,
	},
	kissedId: {
		type: Sequelize.STRING,
	},
});

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('kiss')
		.setDescription('Kiss someone!')
		.addUserOption(option =>
			option
				.setName('user')
				.setRequired(true)
				.setDescription('The person to kiss :P'))
		.addBooleanOption(option =>
			option
				.setName('notify')
				.setDescription('Whether or not to notify the person. Defaults to true.'))
		.addBooleanOption(option =>
			option
				.setName('romantic')
				.setDescription('Whether or not the kiss was romantic or platonic. Defaults to platonic.')),
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
		let tenorSearch;
		let title;
		let notifdesc;
		if (interaction.options.getBoolean("romantic")) {
			tenorSearch = await fetch("https://tenor.googleapis.com/v2/search?q=" + "romantic anime kiss" + "&key=" + tenorKey + "&client_key=" + "DiscordBot" + "&limit=" + 1 + "&random=" + true);
			title = `${interaction.user.displayName} kisses ${interaction.options.getUser("user").displayName} romantically!`
		} else {
			tenorSearch = await fetch("https://tenor.googleapis.com/v2/search?q=" + "platonic anime kiss" + "&key=" + tenorKey + "&client_key=" + "DiscordBot" + "&limit=" + 1 + "&random=" + true);
			title = `${interaction.user.displayName} kisses ${interaction.options.getUser("user").displayName} platonically!`
		}
		const results = await tenorSearch.json();
		const url = results.results[0].media_formats.gif.url;
		let findkiss;
		let description = `One of you has opted out of data collection.`;
		if (!optedOut) {
			findkiss = await kiss.findAll({
				where: {
					userId: interaction.user.id,
					kissedId: interaction.options.getUser("user").id
				}
			});
			await kiss.create({
				userId: interaction.user.id,
				kissedId: interaction.options.getUser("user").id
			});
			description = `${interaction.user.displayName} has kissed ${interaction.options.getUser("user").displayName} ${findkiss.length + 1} time(s)!`;
		}
		const kissEmbed = new EmbedBuilder()
			.setColor(infoColor)
			.setTitle(title)
			.setURL(results.results[0].itemurl)
			//.setAuthor({ name: 'Moderation Event', iconURL: embedIconURL, url: embedURL })
			.setDescription(description)
			.setThumbnail(embedURL)
			// .addFields({ name: 'This message has been deleted: ', value: `\`${msg.cleanContent}\``, inline: true })
			.setImage(url)
			.setTimestamp()
			.setFooter({ text: footerText, iconURL: embedIconURL });

		const embedMessage = await interaction.reply({
			embeds: [kissEmbed], fetchReply: true
		});
		if (interaction.options.getBoolean("romantic")) {
			notifdesc = `${interaction.user.displayName} kissed you romantically in the channel ${embedMessage.url}!`;
		} else {
			notifdesc = `${interaction.user.displayName} kissed you platonically in the channel ${embedMessage.url}!`;
		}
		let notify = interaction.options.getBoolean("notify");
		if (notify == null) {
			notify = true;
		}
		if (notify) {
			const dmNotif = new EmbedBuilder()
				.setColor(infoColor)
				.setTitle(title)
				.setURL(results.results[0].itemurl)
				//.setAuthor({ name: 'Moderation Event', iconURL: embedIconURL, url: embedURL })
				.setDescription(notifdesc + "\n-# Turn notifs off with /notify!")
				.setThumbnail(embedURL)
				// .addFields({ name: 'This message has been deleted: ', value: `\`${msg.cleanContent}\``, inline: true })
				.setImage(url)
				.setTimestamp()
				.setFooter({ text: footerText, iconURL: embedIconURL });
			await interaction.options.getUser("user").send({
				embeds: [dmNotif]
			});
		}
		if (interaction.options.getBoolean("romantic")) {
			await interaction.channel.send({
				content: "-# I do not endorse EDating on Discord, but it is your choice."
			})
		}
	},
};