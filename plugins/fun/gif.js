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
		.setName('randomgif')
		.setDescription('Find a gif using Tenor\'s API!')
		.addStringOption(option =>
			option.setName('category')
				.setDescription('The gif to find.')
				.setRequired(true)
				.addChoices(
					{ name: 'Teto', value: 'kasane teto' },
					{ name: 'Rui', value: 'kamishiro rui' },
					{ name: 'PJSK', value: 'project sekai' },
					{ name: 'Skill Issue', value: 'skill issue' },
				)),
	async execute(interaction) {
		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
		if (tenorKey == "") {
			await interaction.reply({
				content: "The bot owner didn't set up an API key for tenor."
			});
			return;
		}
		const link = await links.findAll({});
		let linkCheck = false;
		link.forEach(async links => {
			if (links.channelId == interaction.channel.id) {
				linkCheck = true;
			}
		})
		if (linkCheck) {
			await interaction.reply({
				content: "Links are blocked in this channel.",
				flags: MessageFlags.Ephemeral
			});
			return;
		}
		const tenorSearch = await fetch("https://tenor.googleapis.com/v2/search?q=" + interaction.options.getString("category") + "&key=" + tenorKey + "&client_key=" + "DiscordBot" + "&limit=" + 1 + "&random=" + true);
		const results = await tenorSearch.json();
		const url = results.results[0].media_formats.gif.url;
		let description = `-# Uses Tenor's API, not AI. I am not responsible for the gif below.`;
		let name;
		switch(interaction.options.getString("category")){
			case "kasane teto":
				name = "Teto gif found!"
				break;
			case "kamishiro rui":
				name = "Rui gif found!"
				break;
			default:
				name = "Gif found!"
		}
		const helloEmbed = new EmbedBuilder()
			.setColor(infoColor)
			.setTitle(name)
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
		});
	},
};