const { SlashCommandBuilder, MessageFlags } = require('discord.js');

const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'database.sqlite',
});

const optOut = sequelize.define('optout', {
    author: {
        type: Sequelize.STRING,
        unique: true,
    }
});

const users = sequelize.define('users', {
    rulesViewed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    author: {
        type: Sequelize.STRING,
        unique: true,
    },
    allowedChannel: {
        type: Sequelize.STRING,
    }
});

const chatLog = sequelize.define('chatLog', {
    channelId: Sequelize.STRING,
    content: Sequelize.TEXT,
    author: Sequelize.STRING
});

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('opt-out')
        .setDescription('Opt out from data collection. Disables certain features and anonymizes all future data.'),
    async execute(interaction) {
        try {
            await optOut.create({
                author: interaction.user.id,
            });
            await chatLog.destroy({ where: { author: interaction.user.id } })
            await users.destroy({ where: { author: interaction.user.id } })
            await interaction.reply({
                content: "Opted out from data collection! - Note that your ID is still stored to opt you out.\n\n-# Certain services will not work for you. Moderation functions in this server still require your username and ID.",
                flags: MessageFlags.Ephemeral
            });
            console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] ${interaction.user.id} has opted out.`);
        }
        catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                await interaction.reply({ content: "Already opted out.", flags: MessageFlags.Ephemeral });
                console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] ${interaction.user.id} has already opted out.`);
                return
            }
            await interaction.reply("Something went wrong.");
            console.log("[" + DateFormatter.format(Date.now()) + `] [WARN] Something went wrong while trying to opt-out ${interaction.user.id}!`);
        }
    },
};