const { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder, PermissionsBitField, MessageFlags, EmbedBuilder } = require('discord.js');
const Sequelize = require('sequelize');
const { embedURL, embedIconURL, footerText, devID, muteColor, infoColor } = require('../../config.js');
const { calcDuration } = require('../../functions/duration.js')
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
		.setName('mute')
		.setDescription('Mute (timeout) a member!')
		.addUserOption(option =>
			option
				.setName('user')
				.setRequired(true)
				.setDescription('The user to mute.'))
		.addStringOption(option =>
			option
				.setName('reason')
				.setRequired(true)
				.setDescription('The mute reason.')
				.setMaxLength(100))
		.addIntegerOption(option =>
			option
				.setName('duration')
				.setRequired(true)
				.setDescription('The duration time, in numbers.'))
		.addStringOption(option =>
			option
				.setName('unit')
				.setRequired(true)
				.setDescription('The duration unit (Second, Day, etc).')
				.addChoices(
					{ name: 'Second', value: 's' },
					{ name: 'Minute', value: 'm' },
					{ name: 'Hour', value: 'h' },
					{ name: 'Day', value: 'd' },
				)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
		if (interaction.guild != null) {
			if (interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
				if (interaction.options.getUser("user").id == interaction.user.id && !(interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))) {
					await interaction.reply({ content: "You don't have permission to mute yourself.", flags: MessageFlags.Ephemeral });
					return;
				}
				let guildMember = await interaction.guild.members.fetch(interaction.options.getUser("user").id);
				if (guildMember.moderatable) {
					if (interaction.member.roles.highest.comparePositionTo(guildMember.roles.highest) <= 0) {
						await interaction.reply({ content: `You don't have permission to mute ${guildMember.user.username}.`, flags: MessageFlags.Ephemeral });
					} else {
						let muteReason;
						if (interaction.options.getString('reason') == null) {
							muteReason = "No reason given.";
						} else {
							muteReason = interaction.options.getString('reason');
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

						// mute duration lol
						let durationTime = interaction.options.getInteger('duration');
						let durationUnit = interaction.options.getString('unit');
						const duration = await calcDuration(durationTime, durationUnit);
						console.log(duration);
						if (duration > (24 * 60 * 60 * 28)) {
							await interaction.reply({ content: `The duration of ${durationTime}${durationUnit} is too long.`, flags: MessageFlags.Ephemeral })
						}
						if (duration < 1) {
							await interaction.reply({ content: `The duration of ${durationTime}${durationUnit} is invalid.`, flags: MessageFlags.Ephemeral })
						}

						// warn system
						await warnings.create({
							userId: guildMember.id,
							reason: muteReason + `\n-# This mute expires <t:${Math.floor(Date.now() / 1000) + duration}:R>.`,
							issuer: `${interaction.user.username} (${interaction.user.id})`,
							server: interaction.guildId,
						});

						const warnListUser = await warnings.findAll({
							where: {
								userId: guildMember.id,
								server: interaction.guildId,
							}
						});
						const muteEmbed = new EmbedBuilder()
							.setColor(muteColor)
							.setTitle(`Muted (Warning ${warnListUser.length})`)
							.setURL(embedURL)
							//.setAuthor({ name: 'Moderation Event', iconURL: embedIconURL, url: embedURL })
							.setDescription(`You have been muted by \`${interaction.user.username}\` for: \`${muteReason}\`.\nThis mute expires <t:${Math.floor(Date.now() / 1000) + duration}:R>.`)
							.setThumbnail(embedURL)
							// .addFields({ name: 'Inline field title', value: 'Some value here', inline: true })
							// .setImage('https://i.imgur.com/AfFp7pu.png')
							.setTimestamp()
							.setFooter({ text: footerText, iconURL: embedIconURL });
						if (modChannelBool) {
							const muteEmbed2 = new EmbedBuilder()
								.setColor(muteColor)
								.setTitle(`Muted (Warning ${warnListUser.length})`)
								.setURL(embedURL)
								//.setAuthor({ name: 'Moderation Event', iconURL: embedIconURL, url: embedURL })
								.setDescription(`\`${guildMember.user}\` (\`${guildMember.user.username}\`) has been muted by \`${interaction.user.username}\` (\`${interaction.user.id}\`) for ${durationTime}${durationUnit}, with the reason \`${muteReason}\`.\n-# This mute has been logged as a warning, and they now have ${warnListUser.length} warning(s).`)
								.setThumbnail(embedURL)
								// .addFields({ name: 'This message has been deleted: ', value: `\`${msg.cleanContent}\``, inline: true })
								// .setImage('https://i.imgur.com/AfFp7pu.png')
								.setTimestamp()
								.setFooter({ text: footerText, iconURL: embedIconURL });
							await modChannel.send({ embeds: [muteEmbed2] });
						}
						try {
							await guildMember.send({ embeds: [muteEmbed] });
						} catch (error) {
							await interaction.reply({ content: `Muted member "${guildMember.user.username}" for ${durationTime}${durationUnit} with the reason ${muteReason}, but could not DM the user.`, flags: MessageFlags.Ephemeral });
							const muteEmbed3 = new EmbedBuilder()
								.setColor(infoColor)
								.setTitle(`Info Event`)
								.setURL(embedURL)
								.setDescription(`The user \`${guildMember.user}\` (\`${guildMember.user.username}\`) could not be DMed. Reason: \`${error}\``)
								.setThumbnail(embedURL)
								.setTimestamp()
								.setFooter({ text: footerText, iconURL: embedIconURL });
							await modChannel.send({ embeds: [muteEmbed3] });
							await guildMember.timeout(duration * 1000);
							return;
						}
						guildMember.timeout(duration * 1000);
						await interaction.reply({ content: `Muted member "${guildMember.user.username}" for ${durationTime}${durationUnit} for reason ${muteReason}`, flags: MessageFlags.Ephemeral });
						console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] The user \`${interaction.user.id}\` (${interaction.user.username}) muted ${guildMember.user.username} (${interaction.options.getString('id')}).`);
					}
				} else {
					await interaction.reply({ content: `I don't have permission to mute ${guildMember.user.username}`, flags: MessageFlags.Ephemeral });
				}
			} else {
				await interaction.reply({ content: "You don't have mute permissions.", flags: MessageFlags.Ephemeral });
			}


		} else {
			await interaction.reply("This command does not work in DMs. Try again in a server!")
		}
		return;
	},
};