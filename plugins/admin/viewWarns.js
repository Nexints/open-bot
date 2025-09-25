const { SlashCommandBuilder, PermissionsBitField, MessageFlags, EmbedBuilder } = require('discord.js');
const Sequelize = require('sequelize');
const { embedURL, embedIconURL, footerText, devID } = require('../../config.js');
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
        .setName('viewwarn')
        .setDescription('View warnings for a user!')
        .addUserOption(option =>
            option
                .setName('user')
                .setRequired(true)
                .setDescription('The user to view.'))
        .addIntegerOption(option =>
            option
                .setName('page')
                .setRequired(true)
                .setDescription('Page?')),
    async execute(interaction) {
        // interaction.user is the object representing the User who ran the command
        // interaction.member is the GuildMember object, which represents the user in the specific guild
        if (interaction.guild != null) {
            if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                let guildMember = interaction.options.getUser("user");
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
                const warnListUser = await warnings.findAll({
                    where: {
                        userId: guildMember.id,
						server: interaction.guildId,
                    }
                });
                let page = interaction.options.getInteger("page");
                if (page < 1) {
                    page = 1;
                }
                let listWarns = `Warns for ${guildMember.username}:\n`;
                for (let i = (page - 1) * 4; i < Math.min(4 + ((page - 1) * 4), warnListUser.length); i++) {
                    listWarns = listWarns + `Case ${i + 1}:`
                    listWarns = listWarns + `\nReason: ${warnListUser[i].reason}`
                    listWarns = listWarns + `\nIssuer: ${warnListUser[i].issuer}`
                    listWarns = listWarns + `\n\n`
                }
                if (warnListUser.length == 0) {
                    listWarns = listWarns + `No warns currently present.`
                } else {
                    listWarns = listWarns + `Page ${page}/${Math.ceil((warnListUser.length) / 4)}`
                }
                await interaction.reply({ content: listWarns, flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ content: "You don't have warn permissions.", flags: MessageFlags.Ephemeral });
            }
        } else {
            await interaction.reply("This command does not work in DMs. Try again in a server!")
        }
        return;
    },
};