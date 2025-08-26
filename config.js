// Pre-requisits. Do not touch these.
const { Collection, Events, GatewayIntentBits, PermissionsBitField, Partials, MessageFlags, ActivityType } = require('discord.js');
let date = new Date();

module.exports = {

    // These can be changed, depending on your needs.
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
    botActivity: "@Nexint on YT!",
    botStatus: "online",
    botURL: "https://twitch.tv/nexints", // Bot's URL for streaming. Automatically credits me if the botType is streaming!
    botType: ActivityType.Listening,

    // Note that these commands are buggy, and may not work.
    restart: "start start.bat", // Restart command. This would be different on a linux based system. It would be "sh start.sh".

    // Known non-working commands. May end up working at a future date.
    autoModAPI: false,
    autoModAPIToken: "", // Prodeode's Auto Mod Token - Optional, but enhanced security!

    // These can be changed, but only if you know what you are doing.
    dateOptions: {
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
    },
    logFormat: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`, // Log format of the bot

    // Do not change these. Used for version checking and updating.
    version: "0.1.2",
    versionID: 6,
    botChannel: "beta"
}