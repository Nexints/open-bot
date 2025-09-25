const { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder, PermissionsBitField, MessageFlags, EmbedBuilder } = require('discord.js');
const Sequelize = require('sequelize');
const { embedURL, embedIconURL, footerText, devID, pardonColor, infoColor } = require('../../config.js');
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
        .setName('liftwarn')
        .setDescription('Delete warnings for a user, and shifts cases around!')
        .addUserOption(option =>
            option
                .setName('user')
                .setRequired(true)
                .setDescription('The user to delete a warn from.'))
        .addIntegerOption(option =>
            option
                .setName('case')
                .setRequired(true)
                .setDescription('Which case to remove?'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        // interaction.user is the object representing the User who ran the command
        // interaction.member is the GuildMember object, which represents the user in the specific guild
        if (interaction.guild != null) {
            if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                let guildMember = interaction.options.getUser("user");
                try {
                    guildMember = await interaction.guild.members.fetch(guildMember);
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
                // log for mod channel
                const modChannelIDs = await modlog.findAll();
                let modChannelBool = false;
                let modTemp = false;
                let modChannel;
                for (let i = 0; i < modChannelIDs.length; i++) {
                    let channel = client.channels.cache.get(modChannelIDs[i].channelId)
                    try {
                        if (channel.guildId == interaction.guild.id) {
                            modChannelBool = true;
                            modTemp = true;
                            modChannel = await client.channels.fetch(modChannelIDs[i].channelId);
                        }
                    } catch { }
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
                const warnListUser = await warnings.findAll({
                    where: {
                        userId: guildMember.id,
						server: interaction.guildId,
                    }
                });
                let warnCase = interaction.options.getInteger('case');
                if (warnCase < 1) {
                    warnCase = 1;
                }
                if (warnListUser.length >= warnCase) {
                    const warnEmbed = new EmbedBuilder()
                        .setColor(pardonColor)
                        .setTitle(`Lifted Warning ${warnCase}`)
                        .setURL(embedURL)
                        .setDescription(`Your warn for \`${warnListUser[warnCase - 1].reason}\` has been lifted. You now have ${warnListUser.length - 1} warnings on ${interaction.guild}.`)
                        .setThumbnail(embedURL)
                        .setTimestamp()
                        .setFooter({ text: footerText, iconURL: embedIconURL });
                    if (modChannelBool) {
                        const warnEmbed2 = new EmbedBuilder()
                            .setColor(pardonColor)
                            .setTitle(`Lifted Warning (Case ${warnCase} / ${warnListUser.length})`)
                            .setURL(embedURL)
                            .setDescription(`The warn for \`${guildMember.user}\` (\`${guildMember.user.username}\`), with the reason ${warnListUser[warnCase - 1].reason}, has been pardoned by ${interaction.user.username} (${interaction.user.id}). They now have ${warnListUser.length - 1} warning(s).`)
                            .setThumbnail(embedURL)
                            .setTimestamp()
                            .setFooter({ text: footerText, iconURL: embedIconURL });
                        await modChannel.send({ embeds: [warnEmbed2] });
                    }
                    warnListUser[warnCase - 1].destroy();
                    try {
                        await guildMember.send({ embeds: [warnEmbed] });
                    } catch (error) {
                        await interaction.reply({ content: `Wiped warn case ${warnCase} from user \`${guildMember.user.username}\`, but could not DM the user.`, flags: MessageFlags.Ephemeral });
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
                    await interaction.reply({ content: `Wiped warn case ${warnCase} from user \`${guildMember.user.username}\`.`, flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ content: "Invalid case.", flags: MessageFlags.Ephemeral });
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