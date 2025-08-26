const { SlashCommandBuilder, MessageFlags, PermissionsBitField } = require('discord.js');

const { devID } = require('../../config.js');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('send')
        .setDescription('Send messages as the bot! Only works if the developer has permission.')
        .addStringOption(option =>
            option
                .setName('channel')
                .setRequired(true)
                .setDescription('Which Discord channel to send the message to?'))
        .addStringOption(option =>
            option
                .setName('message')
                .setRequired(true)
                .setDescription('Message!')),
    async execute(interaction) {
        // interaction.user is the object representing the User who ran the command
        // interaction.member is the GuildMember object, which represents the user in the specific guild
        if (interaction.user.id == devID) {
            const updateMessage = interaction.options.getString('message');
            let channel;
            try {
                channel = await client.channels.fetch(interaction.options.getString('channel'));
            } catch (error){
                await interaction.reply({
                    content: "This channel is a DM, or is otherwise inaccessable / invalid. No message has been sent.\n\nError: " + error,
                    flags: MessageFlags.Ephemeral
                });
                console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] User ${interaction.user.id} (${interaction.user.username}) tried sending the message ${updateMessage}, but the channel ${interaction.options.getString('channel')} was inaccessable or invalid!`);
                return;
            }
            if (channel.permissionsFor(channel.guild.members.me).has(['ViewChannel', 'SendMessages'], true) && !(channel.permissionsFor(interaction.user) == null) && channel.permissionsFor(interaction.user).has(['ManageChannels'], true) ) {
                channel.send(updateMessage); await interaction.reply({
                    content: "Sent the message \"" + updateMessage + "\" to the channel " + interaction.options.getString('channel') + "!",
                    flags: MessageFlags.Ephemeral
                });
                console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] User ${interaction.user.id} (${interaction.user.username}) sent the message ${updateMessage} in the channel ${interaction.options.getString('channel')}!`);
            } else {
                await interaction.reply({
                    content: "You or I don't have permissions to send messages as the bot here.",
                    flags: MessageFlags.Ephemeral
                });
                console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] User ${interaction.user.id} (${interaction.user.username}) tried sending the message ${updateMessage} in the channel ${interaction.options.getString('channel')}, but either the bot owner or the bot itself doesn't have permission!`);
            }

        } else {
            await interaction.reply({ content: "You don't have permission to do this.", flags: MessageFlags.Ephemeral });
        }
        return;
    }
};