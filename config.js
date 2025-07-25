// Pre-requisits. Do not touch these.
const { Collection, Events, GatewayIntentBits, PermissionsBitField, Partials, MessageFlags } = require('discord.js');
let date = new Date();

module.exports = {

    // These may need to be changed.
    token: "CHANGEME", // Bot Token
    clientId: "CHANGEME", // Bot Client ID
    devID: "CHANGEME", // Dev ID
    intents: [ // All of the bot's permissions
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
    ],
    partials: [ // All of the bot's partials
        Partials.Channel,
        Partials.Message
    ],
    logFormat: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`, // Log format of the bot
    // Note that this command is buggy, and may not work.
    restart: "start start.bat", // This would be different on a linux based system. It would be "sh start.sh".

    // Do not change these. Used for version checking and updating.
    version: "0.0.1",
    versionID: 1,
}