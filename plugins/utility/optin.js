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

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('opt-in')
        .setDescription('Opt in to data collection.'),
    async execute(interaction) {
        const rowCount = await optOut.destroy({ where: { author: interaction.user.id } })
            if (!rowCount) {
                await interaction.reply({ content: "Already opted in.", flags: MessageFlags.Ephemeral });
                console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] ${interaction.user.id} is already opted in.`);
                return
            }
            await interaction.reply({ content: "Opted in to data collection.", flags: MessageFlags.Ephemeral });
            console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] ${interaction.user.id} has opted in.`);
    },
};