const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const { devID } = require('../../config.js');

const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'database.sqlite',
});

const devdb = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'devdb.sqlite',
});


const chatLog = devdb.define('chatLog', {
    channelId: Sequelize.STRING,
    content: Sequelize.TEXT,
    author: Sequelize.STRING
});

const users = devdb.define('users', {
    author: {
        type: Sequelize.STRING,
    },
    allowedChannel: {
        type: Sequelize.STRING,
    }
});

const updates = devdb.define('updates', {
    channelId: {
        type: Sequelize.STRING,
    },
    channel: {
        type: Sequelize.STRING,
    },
    type: {
        type: Sequelize.STRING,
    },
});

const optOut = sequelize.define('optout', {
    author: {
        type: Sequelize.STRING,
        unique: true,
    }
});

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('dev')
        .setDescription('Developer commands. Only accessable by the bot developer.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Clears something from the bot.')
                .addStringOption(option =>
                    option
                        .setName('value')
                        .setRequired(true)
                        .setDescription('What to clear?')
                        .addChoices(
                            { name: 'Message Logs', value: 'logs' },
                            { name: 'Channel IDs', value: 'ids' },
                            { name: 'User Metadata', value: 'users' },
                            { name: 'Everything', value: 'all' },
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('update')
                .setDescription('Broadcast a message as the bot.')
                .addStringOption(option =>
                    option
                        .setName('channel')
                        .setRequired(true)
                        .setDescription('Which channel to broadcast the update?')
                        .addChoices(
                            { name: 'update', value: 'update' },
                            { name: 'test', value: 'test' },
                            { name: 'announcements', value: 'announcements' },
                        ))
                .addStringOption(option =>
                    option
                        .setName('message')
                        .setRequired(true)
                        .setDescription('Update message!')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('allow')
                .setDescription('Allows a user to send broadcast messages.')
                .addStringOption(option =>
                    option
                        .setName('id')
                        .setRequired(true)
                        .setDescription('The ID of the user!'))
                .addStringOption(option =>
                    option
                        .setName('channel')
                        .setRequired(true)
                        .setDescription('Which channel to allow?')
                        .addChoices(
                            { name: 'all', value: 'all' },
                            { name: 'update', value: 'update' },
                            { name: 'test', value: 'test' },
                            { name: 'announcements', value: 'announcements' },
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('deny')
                .setDescription('Denies a user to send broadcast messages.')
                .addStringOption(option =>
                    option
                        .setName('id')
                        .setRequired(true)
                        .setDescription('The ID of the user!'))),
    async execute(interaction) {
        // interaction.user is the object representing the User who ran the command
        // interaction.member is the GuildMember object, which represents the user in the specific guild
        if (interaction.user.id == devID) {
            switch (interaction.options.getSubcommand()) {
                case "clear":
                    switch (interaction.options.getString('value')) {
                        case "logs":
                            await chatLog.destroy({ where: {} });
                            await interaction.reply({
                                content: "Deleted all logs of messages in every server.",
                                flags: MessageFlags.Ephemeral
                            });
                            console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Deleted all chat logs.`);
                            break;
                        case "ids":
                            await updates.destroy({ where: {} });
                            await interaction.reply({
                                content: "Deleted all channel IDs where broadcasting is enabled.",
                                flags: MessageFlags.Ephemeral
                            });
                            console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Deleted all IDs where broadcasting is enabled.`);
                            break;
                        case "users":
                            await users.destroy({ where: {} });
                            await interaction.reply({
                                content: "Deleted all users allowed to post messages publicly.",
                                flags: MessageFlags.Ephemeral
                            });
                            console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Deleted all users allowed to post messages.`);
                            break;
                        case "all":
                            await chatLog.destroy({ where: {} });
                            await users.destroy({ where: {} });
                            await updates.destroy({ where: {} });
                            await interaction.reply({
                                content: "Deleted all databases.",
                                flags: MessageFlags.Ephemeral
                            });
                            console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Deleted all databases.`);
                            break;
                    }
                    break;
                case "update":
                    const updateMessage = interaction.options.getString('message');
                    await interaction.deferReply();
                    let msg = "";
                    for (let i = 0; i < updateMessage.length; i++) {
                        let tmpMsg = updateMessage[i];
                        if (updateMessage[i] == "\\") {
                            i += 1;
                            tmpMsg += updateMessage[i];
                            switch (tmpMsg.toLowerCase()) {
                                case "\\n":
                                    tmpMsg = "\n";
                                    break;
                            }
                        }
                        msg += tmpMsg;
                    }
                    const updateChannels = await updates.findAll({ attributes: ['channelId', 'channel', 'type'] });
                    let channels = 0;
                    updateChannels.forEach(async updates => {
                        let channel = await client.channels.fetch(updates.channelId);
                        if (updates.type == "dms") {
                            if (updates.channel == interaction.options.getString('channel')) {
                                channel.send(msg);
                                channels += 1;
                                delay(100);
                            }
                        } else {
                            if (channel.permissionsFor(channel.guild.members.me).has(['ViewChannel', 'SendMessages'], true) && updates.channel == interaction.options.getString('channel')) {
                                channel.send(msg);
                                channels += 1;
                                delay(100);
                            }
                        }
                    })
                    await chatLog.create({
                        channelId: interaction.channelId,
                        content: interaction.user.username + " : " + updateMessage,
                        author: interaction.user.id
                    });
                    await interaction.editReply({
                        content: "Updated all servers (" + channels + ") under channel " + interaction.options.getString('channel') + " with the message:\n\n" + msg,
                        flags: MessageFlags.Ephemeral
                    });
                    break;
                case "allow":
                    const optOutList = await optOut.findAll({ attributes: ['author'] });
                    let disable = false;
                    optOutList.forEach(optOutID => {
                        if (optOutID.author == interaction.user.id) {
                            disable = true;
                        }
                    })
                    if (disable) {
                        await interaction.reply({
                            content: "This ID has opted out of data collection. Do not add them.",
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    }
                    try {
                        const userPerms = await users.findAll({
                            where: {
                                author: interaction.options.getString('id')
                            },
                            attributes: ['author', 'allowedChannel']
                        });
                        let enabled = true;
                        userPerms.forEach(async user => {
                            if (user.channel == interaction.options.getString('channel')) {
                                enabled = false;
                            }
                        })
                        if (enabled) {
                            await users.create({
                                author: interaction.options.getString('id'),
                                allowedChannel: interaction.options.getString('channel')
                            });
                            await interaction.reply({
                                content: "The ID " + interaction.options.getString('id') + " has been allowed to broadcast messages in the " + interaction.options.getString('channel') + " channel.",
                                flags: MessageFlags.Ephemeral
                            });
                        } else {
                            await interaction.reply({ content: "This ID has already been allowed.", flags: MessageFlags.Ephemeral });
                        }
                    }
                    catch (error) {
                        await interaction.reply("Something went wrong. Error: " + error);
                    }
                    break;
                case "deny":
                    const denied = await users.destroy({ where: { author: interaction.options.getString('id') } })
                    if (!denied) {
                        await interaction.reply({ content: "This ID has already been denied.", flags: MessageFlags.Ephemeral });
                        return
                    }
                    await interaction.reply({
                        content: "The ID " + interaction.options.getString('id') + " has been denied from broadcasting on all channels.",
                        flags: MessageFlags.Ephemeral
                    });
                    break;
            }
        } else {
            await interaction.reply({
                content: "You don't have permission to do this.\n\nDev commands are only accessable to the bot developer.",
                flags: MessageFlags.Ephemeral
            });
        }
        return;
    },
};