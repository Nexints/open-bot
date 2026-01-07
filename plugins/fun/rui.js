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


const links = moderation.define('links', {
	channelId: {
		type: Sequelize.STRING,
		unique: true,
	},
});

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('rui')
		.setDescription('Find a Kamishiro Rui gif using Tenor\'s API!'),
	async execute(interaction) {
		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
		if (tenorKey == "") {
			await interaction.reply({
				content: "The bot owner didn't set up an API key for tenor."
			});
			return;
		}
		const tenorSearch = await fetch("https://tenor.googleapis.com/v2/search?q=" + "Kamishiro Rui" + "&key=" + tenorKey + "&client_key=" + "DiscordBot" + "&limit=" + 1 + "&random=" + true);
		const results = await tenorSearch.json();
		const url = results.results[0].media_formats.gif.url;
		let description = `-# Uses Tenor's API, not AI. I am not responsible for the gif below.`;
		const helloEmbed = new EmbedBuilder()
			.setColor(infoColor)
			.setTitle(`Rui gif found!`)
			.setURL(results.results[0].itemurl)
			//.setAuthor({ name: 'Moderation Event', iconURL: embedIconURL, url: embedURL })
			.setDescription(description)
			.setThumbnail(embedURL)
			// .addFields({ name: 'This message has been deleted: ', value: `\`${msg.cleanContent}\``, inline: true })
			.setImage(url)
			.setTimestamp()
			.setFooter({ text: footerText, iconURL: embedIconURL });
		await interaction.reply({
			embeds: [helloEmbed],
			content: "-# This is a silly command, and will be toggleable shortly."
		});
	},
};