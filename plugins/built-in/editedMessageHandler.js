const Sequelize = require('sequelize');
const { chatLog } = require('./../../index.js')
const { autoModAPI, autoModAPIToken, clientId } = require('./../../config.js');
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
        client.on("messageUpdate", async (oldMessage, newMessage) => {
            let msg;
            if(oldMessage.content === newMessage.content || newMessage.author.id == clientId){
                return;
            }else{
                msg = newMessage;
            }
            const optedOutIDs = await optOut.findAll();
            let optedOut = false;
            optedOutIDs.forEach(async ids => {
                if (ids.author == msg.author.id) {
                    optedOut = true;
                }
            })
            if (chatLog) {
                let replied = "";
                let redacted = `${msg.author.username}`;
                if(msg.type == 19){
                    replied = " [Replied]"
                }
                if(optedOut){
                    redacted = "(Redacted)"
                }
                console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] ${redacted} (${msg.channelId}): ${oldMessage.content}${replied} [Original Message]`);
                console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] ${redacted} (${msg.channelId}): ${msg.content}${replied} [Edited Message]`);
            }
            const channel = await client.channels.fetch(msg.channelId);
            let guildMember;
            try {
                guildMember = await msg.guild.members.fetch(msg.author.id);
            } catch { }
            const link = await links.findAll({});
            const blacklists = await blacklist.findAll({});

            // See if moderation checks are required.
            let linkCheck = false;
            let blacklistCheck = false;
            link.forEach(async links => {
                if (links.channelId == channel.id) {
                    linkCheck = true;
                }
            })
            blacklists.forEach(async blacklist => {
                if (blacklist.channelId == channel.id) {
                    blacklistCheck = true;
                }
            })
            if (msg.author.id != client.user.id) {
                if (linkCheck) {
                    if (autoModAPI == false) {
                        const linkEnds = ['.com', '.org', '.net', '.xyz', '.co', '.ca', '.gg']; // coverage for (some) link types
                        const blacklist = ['https://', 'http://', 'discord.gg/']; // block invite links
                        const blacklistCustom = ['/invite/'] // block specific directories (invite)
                        const whitelist = ['tenor.com/', 'cdn.discordapp.com/', 'cdn.discord.com/', 'cdn.discord.gg/', 'nexint.ca', 'nexint.org']; // whitelist specific domains (Whitelisted my domain lol)
                        let blacklisted = false;
                        for (let i = 0; i < blacklist.length; i++) {
                            if (msg.content.includes(blacklist[i])) {
                                blacklisted = true;
                            }
                        }
                        for (let i = 0; i < linkEnds.length; i++) {
                            for (let j = 0; j < blacklistCustom.length; j++) {
                                if (msg.content.includes(linkEnds[i] + blacklistCustom[j])) {
                                    blacklisted = true;
                                }
                            }
                        }
                        if (blacklisted) {
                            let whitelisted = false;
                            for (let i = 0; i < whitelist.length; i++) {
                                if (msg.content.includes(whitelist[i])) {
                                    whitelisted = true;
                                }
                            }
                            if (whitelisted == false) {
                                if (channel.permissionsFor(channel.guild.members.me).has(['ManageMessages'], true)) {
                                    console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] User \`${msg.author.id}\` (${msg.author.username}) tried sending a link in the channel \`${channel.id}\` (${channel.name}). The link was: \`${msg.content}\`.`);
                                    msg.delete();
                                    msg.channel.send("Links are not allowed here.");
                                } else if (channel.permissionsFor(channel.guild.members.me).has(['ViewChannel', 'SendMessages'], true)) {
                                    msg.channel.send("I tried deleting a message here, but I have no permissions!\n-# This is typically caused by bad bot permissions. Please give me the manage messages permission to enable this!");
                                    console.log("[" + DateFormatter.format(Date.now()) + `] [WARN] User \`${msg.author.id}\` (${msg.author.username}) tried sending a link in the channel \`${channel.id}\` (${channel.name}), but the bot does not have the necessary permissions to delete the message. The link was: \`${msg.content}\`.`);
                                } else {
                                    console.log("[" + DateFormatter.format(Date.now()) + `] [WARN] User \`${msg.author.id}\` (${msg.author.username}) tried sending a link in the channel \`${channel.id}\` (${channel.name}), but the bot does not have the necessary permissions to delete or send messages. The link was: \`${msg.content}\`.`);
                                }
                            }
                        }
                    }
                }
                if (blacklistCheck) {
                    if (autoModAPI == false) {
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
                        if (blacklistCheck) {
                            if (channel.permissionsFor(channel.guild.members.me).has(['ManageMessages'], true)) {
                                console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] User \`${msg.author.id}\` (${msg.author.username}) tried sending a blacklisted word in the channel \`${channel.id}\` (${channel.name}). The word was: \`${msg.content}\`.`);
                                msg.delete();
                                msg.channel.send("This word is blacklisted.");
                            } else if (channel.permissionsFor(channel.guild.members.me).has(['ViewChannel', 'SendMessages'], true)) {
                                msg.channel.send("I tried deleting a message here, but I have no permissions!\n-# This is typically caused by bad bot permissions. Please give me the manage messages permission to enable this!");
                                console.log("[" + DateFormatter.format(Date.now()) + `] [WARN] User \`${msg.author.id}\` (${msg.author.username}) tried sending a blacklisted word in the channel \`${channel.id}\` (${channel.name}), but the bot does not have the necessary permissions to delete the message. The word was: \`${msg.content}\`.`);
                            } else {
                                console.log("[" + DateFormatter.format(Date.now()) + `] [WARN] User \`${msg.author.id}\` (${msg.author.username}) tried sending a blacklisted word in the channel \`${channel.id}\` (${channel.name}), but the bot does not have the necessary permissions to delete or send messages. The word was: \`${msg.content}\`.`);
                            }
                        }
                    }
                }
            }
        })
    }
}