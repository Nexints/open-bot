const Sequelize = require('sequelize');
const { chatLog } = require('../../index.js')
const { autoModAPI, autoModAPIToken, clientId, spamDelete, spamLog, spamDelay, spamWarn, embedURL, embedIconURL, spamWarnReason, footerText, warnColor, delMsgColor } = require('../../config.js');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
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

const modlog = moderation.define('modlog', {
    channelId: {
        type: Sequelize.STRING,
        unique: true,
    },
});

const warnings = moderation.define('warnings', {
    userId: {
        type: Sequelize.STRING,
    },
    reason: {
        type: Sequelize.STRING,
    },
    issuer: {
        type: Sequelize.STRING,
    },
    server: {
        type: Sequelize.STRING,
    },
});

const messages = moderation.define('messages', {
    userId: {
        type: Sequelize.STRING,
    },
    content: {
        type: Sequelize.STRING,
    },
    messageId: {
        type: Sequelize.STRING,
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
            const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

            // Logs message author for 5 seconds. Checks if >5 messages in 5 seconds.
            if (msg.author.id != client.user.id) {
                await messages.create({
                    userId: msg.author.id,
                    content: msg.content,
                    messageId: msg.id
                });
            }

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
            const modChannelIDs = await modlog.findAll();
            const messageCount = await messages.findAll({
                where: {
                    userId: msg.author.id
                }
            });
            let logged = false;
            let logTemp = false;
            let loggedChannelID;
            let logChannel;
            loggedIDs.forEach(async loggedChannel => {
                try {
                    let channel = await client.channels.fetch(loggedChannel.channelId)
                    if (channel.guildId == msg.guildId) {
                        logged = true;
                        logTemp = true;
                        loggedChannelID = loggedChannel.channelId;
                    }
                } catch {
                    await logging.destroy({
                        where: {
                            channelId: loggedChannel.channelId,
                        }
                    });
                }
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
                        if (messageCount.length > spamLog) {
                            redacted = `${msg.author.username} (Spam?)`;
                        }
                        if (messageCount.length > spamDelete) {
                            redacted = `${msg.author.username} (Auto Deleted)`;
                        }
                        if (messageCount.length > spamWarn) {
                            redacted = `${msg.author.username} (Auto Warned)`;
                        }
                        await logChannel.send(`(${msg.url}) \`${redacted}: ${msg.cleanContent}\` (${msg.id})${replied}`);
                    } else {
                        await logging.destroy({
                            where: {
                                channelId: loggedChannelID,
                            }
                        });
                        logged = false;
                    }
                }
            })
            const channel = msg.channel;

            // log for mod channel
            let modChannelBool = false;
            let modChannel;
            if (msg.guild != undefined) {
                modChannelIDs.forEach(async modChannels => {
                    let channel = await client.channels.fetch(modChannels.channelId)
                    if (channel.guildId == msg.guild.id) {
                        modChannelBool = true;
                        modChannel = await client.channels.fetch(modChannels.channelId);
                        if (msg.author.id != clientId && !(modChannel.permissionsFor(channel.guild.members.me).has(['ViewChannel', 'SendMessages'], true))) {
                            modlog.destroy({
                                where: {
                                    channelId: modChannels.channelId
                                }
                            })
                            modChannelBool = false;
                        }
                    }
                })
            } else {
                await messages.destroy({
                    where: {
                        userId: msg.author.id,
                        messageId: msg.id,
                    }
                });
                return;
            }
            // uhhh
            let guildMember;
            guildMember = await msg.guild.members.fetch(msg.author.id);
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
            // Skips moderation checks when messageCount > spamDelete
            let botMessage;
            if (messageCount.length < spamDelete + 1) {
                if (msg.author.id != client.user.id && msg.guild != null) {
                    if (autoModAPI == false) {
                        if ((linkCheck || inviteCheck)) {

                            // defines blacklisted and whitelisted links
                            const linkEnds = ['.com', '.org', '.net', '.xyz', '.co', '.ca', '.gg']; // coverage for (some) link types
                            const blacklist = ['https://', 'http://']; // block all links
                            const blacklistInvites = ['discord.gg/', 'discord.com']; // block invite links
                            const blacklistCustom = ['/invite'] // block specific directories in the covered link types (invite)
                            const whitelist = ['tenor.com/', 'cdn.discordapp.com/', 'cdn.discord.com/', 'cdn.discord.gg/', 'media.discordapp.net']; // whitelist specific domains (Whitelisted my domain lol)
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
                                    if (modChannelBool) {
                                        const inviteDeleteEmbed = new EmbedBuilder()
                                            .setColor(delMsgColor)
                                            .setTitle('Deleted Message')
                                            .setURL(embedURL)
                                            //.setAuthor({ name: 'Moderation Event', iconURL: embedIconURL, url: embedURL })
                                            .setDescription(`The ${linkOrMessage} \`${msg.cleanContent}\` has been deleted automatically.`)
                                            .setThumbnail(embedURL)
                                            .addFields({ name: 'Offending user:', value: `\`${msg.author}\` (\`${msg.author.username}\`)` })
                                            // .setImage('https://i.imgur.com/AfFp7pu.png')
                                            .setTimestamp()
                                            .setFooter({ text: footerText, iconURL: embedIconURL });
                                        await modChannel.send({ embeds: [inviteDeleteEmbed] });
                                    }
                                    if (channel.permissionsFor(channel.guild.members.me).has(['ManageMessages'], true)) {
                                        // console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] User \`${msg.author.id}\` (${msg.author.username}) tried sending a ${linkOrMessage} in the channel \`${channel.id}\` (${channel.name}). The ${linkOrMessage} was: \`${msg.content}\`.`);
                                        await msg.delete();
                                        botMessage = await msg.channel.send(`${msg.author}, ${linkOrMessageCaps}s are not allowed here.`);
                                    } else {
                                        if (channel.permissionsFor(channel.guild.members.me).has(['ViewChannel', 'SendMessages'], true)) {
                                            botMessage = await msg.channel.send("I tried deleting a message here, but I have no permissions!\n-# This is typically caused by bad bot permissions. Please give me the \"Manage Messages\" permission to enable this!");
                                        }
                                        // console.log("[" + DateFormatter.format(Date.now()) + `] [WARN] User \`${msg.author.id}\` (${msg.author.username}) tried sending a ${linkOrMessage} in the channel \`${channel.id}\` (${channel.name}), but the bot does not have the necessary permissions to delete or send messages. The link was: \`${msg.content}\`.`);
                                        if (logged && logChannel.permissionsFor(channel.guild.members.me).has(['ViewChannel', 'SendMessages'], true)) {
                                            await logChannel.send(`[WARN] User \`${msg.author.id}\` (${msg.author.username}) tried sending a ${linkOrMessage} in the channel ${channel}, but the bot does not have the necessary permissions to delete messages. Please give me the \'Manage Messages\' permission to enable this! The link was: \`${msg.content}\`.`);
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
                                if (modChannelBool) {
                                    const inviteDeleteEmbed = new EmbedBuilder()
                                        .setColor(delMsgColor)
                                        .setTitle('Deleted Message')
                                        .setURL(embedURL)
                                        //.setAuthor({ name: 'Moderation Event', iconURL: embedIconURL, url: embedURL })
                                        .setDescription(`The blacklisted word in the message \`${msg.cleanContent}\` has been deleted automatically.`)
                                        .setThumbnail(embedURL)
                                        .addFields({ name: 'Offending user:', value: `\`${msg.author}\` (\`${msg.author.username}\`)` })
                                        // .setImage('https://i.imgur.com/AfFp7pu.png')
                                        .setTimestamp()
                                        .setFooter({ text: footerText, iconURL: embedIconURL });
                                    await modChannel.send({ embeds: [inviteDeleteEmbed] });
                                }
                                if (channel.permissionsFor(channel.guild.members.me).has(['ManageMessages'], true)) {
                                    // console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] User \`${msg.author.id}\` (${msg.author.username}) tried sending a blacklisted word in the channel \`${channel.id}\` (${channel.name}). The word was: \`${msg.content}\`.`);
                                    await msg.delete();
                                    botMessage = await msg.channel.send(`${msg.author}, This word is blacklisted.`);
                                } else {
                                    if (channel.permissionsFor(channel.guild.members.me).has(['ViewChannel', 'SendMessages'], true)) {
                                        botMessage = await msg.channel.send("I tried deleting a message here, but I have no permissions!\n-# This is typically caused by bad bot permissions. Please give me the manage messages permission to enable this!");
                                    }
                                    // console.log("[" + DateFormatter.format(Date.now()) + `] [WARN] User \`${msg.author.id}\` (${msg.author.username}) tried sending a blacklisted word in the channel \`${channel.id}\` (${channel.name}), but the bot does not have the necessary permissions to delete or send messages. The word was: \`${msg.content}\`.`);
                                    if (logged && logChannel.permissionsFor(channel.guild.members.me).has(['ViewChannel', 'SendMessages'], true)) {
                                        await logChannel.send(`[WARN] User \`${msg.author.id}\` (${msg.author.username}) tried sending a blacklisted word in the channel ${channel}, but the bot does not have the necessary permissions to delete or send messages. Please give me the \'Manage Messages\' permission to enable this! The word was: \`${msg.content}\`.`);
                                    }
                                }
                            }
                        }
                    } else {
                        // Currently waiting for the actual auto-mod.
                        if (logged && msg.author.id != clientId && logChannel.permissionsFor(channel.guild.members.me).has(['ViewChannel', 'SendMessages'], true)) {
                            await logChannel.send(`Note that the auto-mod API is enabled, but does not currently work. Please disable it in the config!`);
                        }

                    }
                    await delay(5000);
                    if (botMessage != undefined) {
                        await botMessage.delete();
                    }
                }
            }
            if (msg.author.id != client.user.id) {
                (async () => {
                    if (messageCount.length > spamDelete) {
                        if (!(messageCount.length > spamWarn) && modChannelBool) {
                            const deleteEmbed = new EmbedBuilder()
                                .setColor(delMsgColor)
                                .setTitle('Deleted Message')
                                .setURL(embedURL)
                                //.setAuthor({ name: 'Moderation Event', iconURL: embedIconURL, url: embedURL })
                                .setDescription(`The spam message \`${msg.cleanContent}\` has been deleted automatically.`)
                                .setThumbnail(embedURL)
                                .addFields({ name: 'Offending user:', value: `\`${msg.author}\` (\`${msg.author.username}\`)` })
                                // .setImage('https://i.imgur.com/AfFp7pu.png')
                                .setTimestamp()
                                .setFooter({ text: footerText, iconURL: embedIconURL });
                            await modChannel.send({ embeds: [deleteEmbed] });
                        }
                        if (channel.permissionsFor(channel.guild.members.me).has(['ManageMessages'], true)) {
                            await msg.delete();
                        }
                    }
                    if (messageCount.length > spamWarn) {
                        await warnings.create({
                            userId: msg.author.id,
                            reason: spamWarnReason,
                            issuer: "automod",
                            server: msg.guild.id
                        });
                        const warnListUser = await warnings.findAll({
                            where: {
                                userId: msg.author.id,
                                server: msg.guild.id
                            }
                        });
                        const warnEmbed = new EmbedBuilder()
                            .setColor(warnColor)
                            .setTitle(`Warning ${warnListUser.length}`)
                            .setURL(embedURL)
                            //.setAuthor({ name: 'Moderation Event', iconURL: embedIconURL, url: embedURL })
                            .setDescription(`You have been warned for: ${spamWarnReason}. You now have ${warnListUser.length} warning(s) on ${msg.guild}.`)
                            .setThumbnail(embedURL)
                            // .addFields({ name: 'Inline field title', value: 'Some value here', inline: true })
                            // .setImage('https://i.imgur.com/AfFp7pu.png')
                            .setTimestamp()
                            .setFooter({ text: footerText, iconURL: embedIconURL });
                        if (modChannelBool) {
                            const warnEmbed2 = new EmbedBuilder()
                                .setColor(warnColor)
                                .setTitle(`Warning (Case ${warnListUser.length})`)
                                .setURL(embedURL)
                                //.setAuthor({ name: 'Moderation Event', iconURL: embedIconURL, url: embedURL })
                                .setDescription(`\`${msg.author}\` (\`${msg.author.username}\`) has been automatically warned for: ${spamWarnReason}. They now have ${warnListUser.length} warning(s).`)
                                .setThumbnail(embedURL)
                                .addFields({ name: 'This message has been deleted: ', value: `\`${msg.cleanContent}\``, inline: true })
                                // .setImage('https://i.imgur.com/AfFp7pu.png')
                                .setTimestamp()
                                .setFooter({ text: footerText, iconURL: embedIconURL });
                            await modChannel.send({ embeds: [warnEmbed2] });
                        }
                        await guildMember.send({ embeds: [warnEmbed] });
                        if (channel.permissionsFor(channel.guild.members.me).has(['ModerateMembers'], true) && !(msg.member.permissions.has(PermissionsBitField.Flags.Administrator)) && guildMember.moderatable) {
                            await guildMember.timeout(5000, spamWarnReason);
                        }
                    }
                    await delay(spamDelay * 1000);
                    await messages.destroy({
                        where: {
                            userId: msg.author.id,
                            messageId: msg.id,
                        }
                    });
                })();
            }
        })
    }
}