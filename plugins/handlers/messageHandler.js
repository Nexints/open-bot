const Sequelize = require('sequelize');
const { chatLog } = require('../../index.js')
const { autoModAPI, autoModAPIToken, clientId } = require('../../config.js');
const moderation = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'moderation.sqlite',
});

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

const links = moderation.define('links', {
    channelId: {
        type: Sequelize.STRING,
        unique: true,
    },
});

const invites = moderation.define('invites', {
    channelId: {
        type: Sequelize.STRING,
        unique: true,
    },
});

const logging = moderation.define('logging', {
    channelId: {
        type: Sequelize.STRING,
        unique: true,
    },
});

const blacklist = moderation.define('blacklist', {
    channelId: {
        type: Sequelize.STRING,
    },
    word: {
        type: Sequelize.STRING,
    },
    strict: {
        type: Sequelize.BOOLEAN,
    },
});

module.exports = {
    async execute() {
        client.on("messageCreate", async msg => {

            // Bot-wide message logging functionality!
            // May be deprecated at a future date.
            const optedOutIDs = await optOut.findAll();
            let optedOut = false;
            optedOutIDs.forEach(async ids => {
                if (ids.author == msg.author.id) {
                    optedOut = true;
                }
            })
            if (chatLog && msg.author.id != clientId) {
                let replied = "";
                let redacted = `${msg.author.username}`;
                if (msg.type == 19) {
                    replied = " [Replied]"
                }
                if (optedOut) {
                    redacted = "(Redacted)"
                }
                console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] ${redacted} (${msg.channelId}): ${msg.content}${replied}`);
            }

            // Server-side message logging functionality!
            // Will not be deprecated.
            const loggedIDs = await logging.findAll();
            let logged = false;
            let logTemp = false;
            let loggedChannelID;
            let logChannel;
            loggedIDs.forEach(async loggedChannel => {
                let channel = client.channels.cache.get(loggedChannel.channelId)
                try {
                    if (channel.guildId == msg.guild.id) {
                        logged = true;
                        logTemp = true;
                        loggedChannelID = loggedChannel.channelId;
                    }
                } catch { } // ignore errors caused by DM'd messages lol
                if (logTemp && msg.author.id != clientId) {
                    logTemp = false;
                    logChannel = await client.channels.fetch(loggedChannelID);
                    if (logChannel.permissionsFor(channel.guild.members.me).has(['ViewChannel', 'SendMessages'], true)) {
                        let replied = "";
                        let redacted = `${msg.author.username}`;
                        if (msg.type == 19) {
                            replied = " [Replied]"
                        }
                        if (optedOut) {
                            redacted = "(Redacted)"
                        }
                        logChannel.send(`(${msg.url}) ${redacted}: ${msg.cleanContent}${replied}`);
                    } else {
                        await logging.destroy({
                            where: {
                                channelId: loggedChannelID,
                            }
                        });
                    }
                }
            })
            const channel = msg.channel; // used to add artificial delay (bonk)
            // archived code lol (might be needed in the future)
            // let guildMember;
            // try {
            //    guildMember = await msg.guild.members.fetch(msg.author.id);
            // } catch { }
            const link = await links.findAll({});
            const invite = await invites.findAll({});
            const blacklists = await blacklist.findAll({});

            // See if moderation checks are required.
            let linkCheck = false;
            let inviteCheck = false;
            let blacklistCheck = false;
            link.forEach(async links => {
                if (links.channelId == channel.id) {
                    linkCheck = true;
                }
            })
            invite.forEach(async invites => {
                if (invites.channelId == channel.id) {
                    inviteCheck = true;
                }
            })
            blacklists.forEach(async blacklist => {
                if (blacklist.channelId == channel.id) {
                    blacklistCheck = true;
                }
            })

            // Does the moderation checks (help so much code)
            // Only done when dealing with server messages.
            if (msg.author.id != client.user.id && msg.guild != null) {
                if (autoModAPI == false) {
                    if ((linkCheck || inviteCheck)) {

                        // defines blacklisted and whitelisted links
                        const linkEnds = ['.com', '.org', '.net', '.xyz', '.co', '.ca', '.gg']; // coverage for (some) link types
                        const blacklist = ['https://', 'http://']; // block all links
                        const blacklistInvites = ['discord.gg/', 'discord.com']; // block invite links
                        const blacklistCustom = ['/invite'] // block specific directories in the covered link types (invite)
                        const whitelist = ['tenor.com/', 'cdn.discordapp.com/', 'cdn.discord.com/', 'cdn.discord.gg/']; // whitelist specific domains (Whitelisted my domain lol)
                        let blacklisted = false;
                        let linkOrMessage = "invite";
                        let linkOrMessageCaps = "Invite";

                        // checks if the link is blacklisted
                        for (let i = 0; i < blacklist.length; i++) {
                            if (msg.content.includes(blacklist[i]) && linkCheck) {
                                blacklisted = true;
                                linkOrMessage = "link";
                                linkOrMessageCaps = "Link";
                            }
                        }
                        for (let i = 0; i < blacklistInvites.length; i++) {
                            if (msg.content.includes(blacklistInvites[i]) && inviteCheck) {
                                blacklisted = true;
                            }
                        }
                        for (let i = 0; i < linkEnds.length; i++) {
                            for (let j = 0; j < blacklistCustom.length; j++) {
                                if (msg.content.includes(linkEnds[i] + blacklistCustom[j]) && inviteCheck) {
                                    blacklisted = true;
                                }
                            }
                        }
                        if (blacklisted) {

                            // checks if the link is whitelisted (overrides blacklist)
                            let whitelisted = false;
                            for (let i = 0; i < whitelist.length; i++) {
                                if (msg.content.includes(whitelist[i])) {
                                    whitelisted = true;
                                }
                            }
                            if (!whitelisted) {

                                // sends an event to the server and client log and attempts to delete the message
                                // for privacy reasons, server log is currently deprecated (non existant), but may be re-implemented at a future date.
                                if (logged && logChannel.permissionsFor(channel.guild.members.me).has(['ViewChannel', 'SendMessages'], true)) {
                                    logChannel.send(`[INFO] User \`${msg.author.id}\` (${msg.author.username}) tried sending a ${linkOrMessage} in the channel ${channel}. The ${linkOrMessage} was: \`${msg.content}\`.`);
                                }
                                if (channel.permissionsFor(channel.guild.members.me).has(['ManageMessages'], true)) {
                                    // console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] User \`${msg.author.id}\` (${msg.author.username}) tried sending a ${linkOrMessage} in the channel \`${channel.id}\` (${channel.name}). The ${linkOrMessage} was: \`${msg.content}\`.`);
                                    msg.delete();
                                    msg.channel.send(`${linkOrMessageCaps}s are not allowed here.`);
                                } else {
                                    if (channel.permissionsFor(channel.guild.members.me).has(['ViewChannel', 'SendMessages'], true)) {
                                        msg.channel.send("I tried deleting a message here, but I have no permissions!\n-# This is typically caused by bad bot permissions. Please give me the \"Manage Messages\" permission to enable this!");
                                    }
                                    // console.log("[" + DateFormatter.format(Date.now()) + `] [WARN] User \`${msg.author.id}\` (${msg.author.username}) tried sending a ${linkOrMessage} in the channel \`${channel.id}\` (${channel.name}), but the bot does not have the necessary permissions to delete or send messages. The link was: \`${msg.content}\`.`);
                                    if (logged && logChannel.permissionsFor(channel.guild.members.me).has(['ViewChannel', 'SendMessages'], true)) {
                                        logChannel.send(`[WARN] User \`${msg.author.id}\` (${msg.author.username}) tried sending a ${linkOrMessage} in the channel ${channel}, but the bot does not have the necessary permissions to delete messages. Please give me the \'Manage Messages\' permission to enable this! The link was: \`${msg.content}\`.`);
                                    }
                                }
                            }
                        }
                    }

                    // checks for blacklisted words
                    if (blacklistCheck) {
                        blacklistCheck = false;
                        blacklists.forEach(async blacklist => {
                            if (blacklist.strict) {
                                if (msg.content.toLowerCase().includes(blacklist.word.toLowerCase())) {
                                    blacklistCheck = true;
                                }
                            } else {
                                const whitespace = [' ', '\n', '\t'];
                                for (let i = 0; i < whitespace.length; i++) {
                                    if (msg.content.toLowerCase().includes(whitespace[i] + blacklist.word.toLowerCase() + whitespace[i]) || msg.content.toLowerCase().includes(blacklist.word.toLowerCase() + whitespace[i]) || msg.content.toLowerCase() == (blacklist.word.toLowerCase())) {
                                        blacklistCheck = true;
                                    }
                                }
                            }
                        })

                        // checks for a blacklist
                        if (blacklistCheck) {
                            if (logged && logChannel.permissionsFor(channel.guild.members.me).has(['ViewChannel', 'SendMessages'], true)) {
                                logChannel.send(`[INFO] User \`${msg.author.id}\` (${msg.author.username}) tried sending a blacklisted word in the channel \`${channel.id}\` (${channel.name}). The word was: \`${msg.content}\`.`);
                            }
                            if (channel.permissionsFor(channel.guild.members.me).has(['ManageMessages'], true)) {
                                // console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] User \`${msg.author.id}\` (${msg.author.username}) tried sending a blacklisted word in the channel \`${channel.id}\` (${channel.name}). The word was: \`${msg.content}\`.`);
                                msg.delete();
                                msg.channel.send("This word is blacklisted.");
                            } else {
                                if (channel.permissionsFor(channel.guild.members.me).has(['ViewChannel', 'SendMessages'], true)) {
                                    msg.channel.send("I tried deleting a message here, but I have no permissions!\n-# This is typically caused by bad bot permissions. Please give me the manage messages permission to enable this!");
                                }
                                // console.log("[" + DateFormatter.format(Date.now()) + `] [WARN] User \`${msg.author.id}\` (${msg.author.username}) tried sending a blacklisted word in the channel \`${channel.id}\` (${channel.name}), but the bot does not have the necessary permissions to delete or send messages. The word was: \`${msg.content}\`.`);
                                if (logged && logChannel.permissionsFor(channel.guild.members.me).has(['ViewChannel', 'SendMessages'], true)) {
                                    logChannel.send(`[WARN] User \`${msg.author.id}\` (${msg.author.username}) tried sending a blacklisted word in the channel ${channel}, but the bot does not have the necessary permissions to delete or send messages. Please give me the \'Manage Messages\' permission to enable this! The word was: \`${msg.content}\`.`);
                                }
                            }
                        }
                    }
                } else {
                    // Currently waiting for the actual auto-mod.
                    if (logged && msg.author.id != clientId && logChannel.permissionsFor(channel.guild.members.me).has(['ViewChannel', 'SendMessages'], true)) {
                        logChannel.send(`Note that the auto-mod API is enabled, but does not currently work. Please disable it in the config!`);
                    }

                }
            }
        })
    }
}