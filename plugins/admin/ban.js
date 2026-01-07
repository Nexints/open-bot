const { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder, PermissionsBitField, MessageFlags, EmbedBuilder } = require('discord.js');
const Sequelize = require('sequelize');
const { embedURL, embedIconURL, footerText, devID, banColor, infoColor } = require('../../config.js');
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

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('ban')
		.setDescription('Ban a member!')
		.addUserOption(option =>
			option
				.setName('user')
				.setRequired(true)
				.setDescription('The user to ban.'))
		.addStringOption(option =>
			option
				.setName('reason')
				.setRequired(true)
				.setDescription('The ban reason.')
				.setMaxLength(100))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
		if (interaction.guild != null) {
			if (interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
                if(interaction.options.getUser("user").id == interaction.user.id && !(interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))){
                    await interaction.reply({ content: "You don't have permission to ban yourself.", flags: MessageFlags.Ephemeral });
                    return;
                }
				let guildMember = await interaction.guild.members.fetch(interaction.options.getUser("user").id);
				if (guildMember.bannable) {
					if (interaction.member.roles.highest.comparePositionTo(guildMember.roles.highest) <= 0) {
						await interaction.reply({ content: `You don't have permission to ban ${guildMember.user.username}.`, flags: MessageFlags.Ephemeral });
					} else {
						let banReason;
						if (interaction.options.getString('reason') == null) {
							banReason = "No reason given.";
						} else {
							banReason = interaction.options.getString('reason');
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
						const banEmbed = new EmbedBuilder()
							.setColor(banColor)
							.setTitle(`Banned`)
							.setURL(embedURL)
							//.setAuthor({ name: 'Moderation Event', iconURL: embedIconURL, url: embedURL })
							.setDescription(`You have been banned by \`${interaction.user.username}\` for: \`${banReason}\`.`)
							.setThumbnail(embedURL)
							// .addFields({ name: 'Inline field title', value: 'Some value here', inline: true })
							// .setImage('https://i.imgur.com/AfFp7pu.png')
							.setTimestamp()
							.setFooter({ text: footerText, iconURL: embedIconURL });
						if (modChannelBool) {
							const banEmbed2 = new EmbedBuilder()
								.setColor(banColor)
								.setTitle(`Banned`)
								.setURL(embedURL)
								//.setAuthor({ name: 'Moderation Event', iconURL: embedIconURL, url: embedURL })
								.setDescription(`\`${guildMember.user}\` (\`${guildMember.user.username}\`) has been banned by \`${interaction.user.username}\` (\`${interaction.user.id}\`) for: \`${banReason}\`.`)
								.setThumbnail(embedURL)
								// .addFields({ name: 'This message has been deleted: ', value: `\`${msg.cleanContent}\``, inline: true })
								// .setImage('https://i.imgur.com/AfFp7pu.png')
								.setTimestamp()
								.setFooter({ text: footerText, iconURL: embedIconURL });
							await modChannel.send({ embeds: [banEmbed2] });
						}
						try {
							await guildMember.send({ embeds: [banEmbed] });
						} catch (error) {
							await interaction.reply({ content: `Banned member "${guildMember.user.username}" for reason ${banReason}, but could not DM the user.`, flags: MessageFlags.Ephemeral });
							const banEmbed3 = new EmbedBuilder()
								.setColor(infoColor)
								.setTitle(`Info Event`)
								.setURL(embedURL)
								.setDescription(`The user \`${guildMember.user}\` (\`${guildMember.user.username}\`) could not be DMed. Reason: \`${error}\``)
								.setThumbnail(embedURL)
								.setTimestamp()
								.setFooter({ text: footerText, iconURL: embedIconURL });
							await modChannel.send({ embeds: [banEmbed3] });
							await guildMember.ban({ reason: banReason });
							return;
						}
						guildMember.ban({ reason: banReason });
						await interaction.reply({ content: `Banned member "${guildMember.user.username}" for reason ${banReason}`, flags: MessageFlags.Ephemeral });
						console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] The user \`${interaction.user.id}\` (${interaction.user.username}) banned ${guildMember.user.username} (${interaction.options.getString('id')}).`);
					}
				} else {
					await interaction.reply({ content: `I don't have permission to ban ${guildMember.user.username}`, flags: MessageFlags.Ephemeral });
				}
			} else {
				await interaction.reply({ content: "You don't have ban permissions.", flags: MessageFlags.Ephemeral });
			}


		} else {
			await interaction.reply("This command does not work in DMs. Try again in a server!")
		}
		return;
	},
};