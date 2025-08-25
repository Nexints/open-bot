const { SlashCommandBuilder, MessageFlags } = require('discord.js');

const { devID, restart } = require('../../config.js');
const { readline, spawn, exitHandler } = require('../../index.js');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('restart')
        .setDescription('Restarts the bot. Bot owner only.'),
    async execute(interaction) {
        // interaction.user is the object representing the User who ran the command
        // interaction.member is the GuildMember object, which represents the user in the specific guild
        if (interaction.user.id == devID) {
            await interaction.reply({
                content: "Restarting bot!",
                flags: MessageFlags.Ephemeral
            });
            console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] User ${interaction.user.id} triggered a bot restart. Restarting now...`);
            console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Restarting bot.');
            console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Closing bot connections.');
            client.destroy();
            console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Closing console access.');
            readline.close();
            console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Preparing the new process.');
            const child = spawn(restart, [''], {
                detatched: true,
                shell: true
            })
            child.unref()
            await exitHandler();
            return true;
        } else {
            await interaction.reply({ content: "You don't have permission to do this.", flags: MessageFlags.Ephemeral });
        }
        return;
    }
};