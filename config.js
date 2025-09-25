// Pre-requisits. Do not touch these.
const { Collection, Events, GatewayIntentBits, PermissionsBitField, Partials, MessageFlags, ActivityType } = require('discord.js');
let date = new Date();

module.exports = {

    // Bot stuff, including all API keys.
    token: "CHANGEME", // Bot Token
    clientId: "CHANGEME", // Bot Client ID
    devID: "CHANGEME", // Dev ID
    tenorKey: "CHANGEME", // tenor api key, can leave as is but will result in a lack of tenor functionality
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

    // Moderation stuff
    spamLog: 4, // how many messages before logging
    spamDelete: 6, // how many messages before deleting
    spamWarn: 7, // how many messages before warning (trying to DM) - set this to 2147483647 to effectively disable
    spamDelay: 2, // how many seconds before resetting this amount
    muteWarnCount: 3, // how many warns before getting muted
    muteBanCount: 3, // how many bans before getting muted

    // Custom Auto-warns
    spamWarnReason: "Spamming", // custom auto-warn reason

    // Cosmetic changes. Change these if you wish not to provide credit to me specifically, or change other things about the bot.
    // Crediting OpenBot is still required, or at the very least, making the source code available. Easiest way is to credit OpenBot.
    botActivity: "@Nexint on YT!",
    botStatus: "online",
    botURL: "https://twitch.tv/nexints", // Bot's URL for streaming. Automatically credits me if the botType is streaming!
    botType: ActivityType.Listening,
    embedURL: "https://nexint.ca/", // credits me in the embed, leave this blank if you want no URL
    embedIconURL: "https://raw.githubusercontent.com/Nexints/Nexints.github.io/refs/heads/main/images/pfp.png", // more credit to me lol
    footerText: "Nexint © 2025. Dev Build-v0.1.4.",
    warnColor: 0xFFFF00,
    delMsgColor: 0x000000,
    muteColor: 0xFF8000,
    kickColor: 0xFF4000,
    banColor: 0xFF0000,
    pardonColor: 0x00FF00,
    infoColor: 0x00FFFF,

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
    version: "0.1.4",
    versionID: 7,
    botChannel: "dev"
}