const { SlashCommandBuilder, MessageFlags } = require('discord.js');

const Sequelize = require('sequelize');

const devdb = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'devdb.sqlite',
});

const users = devdb.define('users', {
    author: {
        type: Sequelize.STRING,
        unique: true,
    },
    allowedChannel: {
        type: Sequelize.STRING,
    }
});

const chatLog = devdb.define('chatLog', {
    channelId: Sequelize.STRING,
    content: Sequelize.TEXT,
    author: Sequelize.STRING
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

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('broadcast')
        .setDescription('Broadcast messages!')
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
                .setDescription('Broadcast message!')),
    async execute(interaction) {
        // interaction.user is the object representing the User who ran the command
        // interaction.member is the GuildMember object, which represents the user in the specific guild
        const allowList = await users.findAll({});
        let allowed = false;
        allowList.forEach(user => {
            if (user.author == interaction.user.id && (user.allowedChannel == interaction.options.getString('channel') || user.allowedChannel == "all")) {
                allowed = true;
            }
        })
        if (allowed) {
            const updateMessage = "This message is from: " + interaction.user.username + "\n\n" + interaction.options.getString('message');
            const updateChannels = await updates.findAll({ attributes: ['channelId', 'channel', 'type'] });
            let channels = 0;
            updateChannels.forEach(async updates => {
                let channel = await client.channels.fetch(updates.channelId);
                if (updates.type == "dms") {
                    if (updates.channel == interaction.options.getString('channel')) {
                        channel.send(updateMessage);
                        channels += 1;
                    }
                } else {
                    if (channel.permissionsFor(channel.guild.members.me).has(['ViewChannel', 'SendMessages'], true) && updates.channel == interaction.options.getString('channel')) {
                        channel.send(updateMessage);
                        channels += 1;
                    }
                }
            })
            await chatLog.create({
                channelId: interaction.channelId,
                content: interaction.user.username + " : " + updateMessage,
                author: interaction.user.id
            });
            await interaction.reply({
                content: "Updated all servers (" + channels + ") under channel " + interaction.options.getString('channel') + " with the message:\n\n" + updateMessage,
                flags: MessageFlags.Ephemeral
            });
        } else {
            await interaction.reply({ content: "You don't have permission to do this.", flags: MessageFlags.Ephemeral });
        }
        return;
    }
};