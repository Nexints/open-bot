const { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder, PermissionsBitField, MessageFlags, EmbedBuilder } = require('discord.js');
const Sequelize = require('sequelize');
const { embedURL, embedIconURL, footerText, devID, warnColor, infoColor } = require('../../config.js');
const moderation = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	// SQLite only
	storage: 'moderation.sqlite',
});

const modlog = moderation.define('modlog', {
	channelId: {
		type: Sequelize.STRING,
		unique: true,
	},
});

const warnings = moderation.define('warnings', {
	userId: {
		type: Sequelize.STRING,
	},
	reason: {
		type: Sequelize.STRING,
	},
	issuer: {
		type: Sequelize.STRING,
	},
	server: {
		type: Sequelize.STRING,
	},
});

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('warn')
		.setDescription('Warn a member!')
		.addUserOption(option =>
			option
				.setName('user')
				.setRequired(true)
				.setDescription('The user to warn.'))
		.addStringOption(option =>
			option
				.setName('reason')
				.setRequired(true)
				.setDescription('The warn reason. Max 100 characters.')
				.setMaxLength(100))
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
		if (interaction.guild != null) {
			if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
				let guildMember = interaction.options.getUser("user");
				try {
					guildMember = await interaction.guild.members.fetch(guildMember.id);
				} catch (error) {
					if (error.rawError.message == "Unknown Member") {
						console.log("[" + DateFormatter.format(Date.now()) + `] [WARN] The user \`${interaction.user.id}\` (${interaction.user.username}) tried warning ${interaction.options.getString('id')}, but the member does not exist!`);
						await interaction.reply({ content: `The specified member does not exist or is already banned.`, flags: MessageFlags.Ephemeral });
					} else if (error.rawError.message == "Invalid Form Body") {
						console.log("[" + DateFormatter.format(Date.now()) + `] [WARN] The user \`${interaction.user.id}\` (${interaction.user.username}) tried warning someone, but the command is malformed!`);
						await interaction.reply({ content: `The ID you inputted is not an ID.`, flags: MessageFlags.Ephemeral });
					} else {
						console.log("[" + DateFormatter.format(Date.now()) + `] [ERROR] ${error}`)
						await interaction.reply({ content: `Something seriously wrong happened. Error: ${error}`, flags: MessageFlags.Ephemeral })
					}
					return
				}
				if ((interaction.member.roles.highest.comparePositionTo(guildMember.roles.highest) <= 0)) {
					await interaction.reply({ content: `You don't have permission to warn ${guildMember.user.username}.`, flags: MessageFlags.Ephemeral });
				} else if (interaction.options.getString('reason').length < 100) {
					let warnReason;
					if (interaction.options.getString('reason') == null) {
						warnReason = "No reason given.";
					} else {
						warnReason = interaction.options.getString('reason');
					}
					// log for mod channel
					const modChannelIDs = await modlog.findAll();
					let modChannelBool = false;
					let modTemp = false;
					let modChannel;
					for (let i = 0; i < modChannelIDs.length; i++) {
						let channel = client.channels.cache.get(modChannelIDs[i].channelId)
						if (channel.guildId == interaction.guild.id) {
							modChannelBool = true;
							modTemp = true;
							modChannel = await client.channels.fetch(modChannelIDs[i].channelId);
						}
						if (modTemp) {
							modTemp = false;
							if (!(modChannel.permissionsFor(channel.guild.members.me).has(['ViewChannel', 'SendMessages'], true))) {
								modlog.destroy({
									where: {
										channelId: modChannelIDs[i].channelId
									}
								})
								modChannelBool = false;
							}
						}
					}
					await warnings.create({
						userId: guildMember.id,
						reason: warnReason,
						issuer: `${interaction.user.username} (${interaction.user.id})`,
						server: interaction.guildId,
					});

					const warnListUser = await warnings.findAll({
						where: {
							userId: guildMember.id,
							server: interaction.guildId,
						}
					});
					const warnEmbed = new EmbedBuilder()
						.setColor(warnColor)
						.setTitle(`Warning ${warnListUser.length}`)
						.setURL(embedURL)
						//.setAuthor({ name: 'Moderation Event', iconURL: embedIconURL, url: embedURL })
						.setDescription(`You have been warned by \`${interaction.user.username}\` for: \`${warnReason}\`. You now have ${warnListUser.length} warnings on ${interaction.guild}.`)
						.setThumbnail(embedURL)
						// .addFields({ name: 'Inline field title', value: 'Some value here', inline: true })
						// .setImage('https://i.imgur.com/AfFp7pu.png')
						.setTimestamp()
						.setFooter({ text: footerText, iconURL: embedIconURL });
					if (modChannelBool) {
						const warnEmbed2 = new EmbedBuilder()
							.setColor(warnColor)
							.setTitle(`Warning (Case ${warnListUser.length})`)
							.setURL(embedURL)
							//.setAuthor({ name: 'Moderation Event', iconURL: embedIconURL, url: embedURL })
							.setDescription(`\`${guildMember.user}\` (\`${guildMember.user.username}\`) has been warned by \`${interaction.user.username}\` (\`${interaction.user.id}\`) for: \`${warnReason}\`. They now have ${warnListUser.length} warning(s).`)
							.setThumbnail(embedURL)
							// .addFields({ name: 'This message has been deleted: ', value: `\`${msg.cleanContent}\``, inline: true })
							// .setImage('https://i.imgur.com/AfFp7pu.png')
							.setTimestamp()
							.setFooter({ text: footerText, iconURL: embedIconURL });
						await modChannel.send({ embeds: [warnEmbed2] });
					}
					try {
						await guildMember.send({ embeds: [warnEmbed] });
					} catch (error) {
						await interaction.reply({ content: `Warned member "${guildMember.user.username}" for reason: ${warnReason}, but could not DM the user.`, flags: MessageFlags.Ephemeral });
						const warnEmbed3 = new EmbedBuilder()
							.setColor(infoColor)
							.setTitle(`Info Event`)
							.setURL(embedURL)
							.setDescription(`The user \`${guildMember.user}\` (\`${guildMember.user.username}\`) could not be DMed. Reason: \`${error}\``)
							.setThumbnail(embedURL)
							.setTimestamp()
							.setFooter({ text: footerText, iconURL: embedIconURL });
						await modChannel.send({ embeds: [warnEmbed3] });
						return;
					}
					await interaction.reply({ content: `Warned member "${guildMember.user.username}" for reason: ${warnReason}`, flags: MessageFlags.Ephemeral });
					console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] The user \`${interaction.user.id}\` (${interaction.user.username}) warned ${guildMember.user.username} (${interaction.options.getString('id')}).`);
				} else {
					await interaction.reply({ content: `Reason is too long. Please shorten your reason!`, flags: MessageFlags.Ephemeral });
				}
			} else {
				await interaction.reply({ content: "You don't have warn permissions.", flags: MessageFlags.Ephemeral });
			}
		} else {
			await interaction.reply("This command does not work in DMs. Try again in a server!")
		}
		return;
	},
};