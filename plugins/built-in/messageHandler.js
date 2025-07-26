const Sequelize = require('sequelize');
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

const links = moderation.define('links', {
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
        console.log("[" + new Date().toLocaleTimeString() + '] [INFO] Loading built-in plugins. These plugins are optional.');
        client.on("messageCreate", async msg => {
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
                    if (msg.content.includes("https://") || msg.content.includes("http://")) {
                        if (channel.permissionsFor(channel.guild.members.me).has(['ManageMessages'], true)) {
                            console.log("[" + new Date().toLocaleTimeString() + `] [INFO] User \`${msg.author.id}\` (${msg.author.username}) tried sending a link in the channel \`${channel.id}\` (${channel.name}). The link was: \`${msg.content}\`.`);
                            msg.delete();
                            msg.channel.send("Links are not allowed here.");
                        } else if (channel.permissionsFor(channel.guild.members.me).has(['ViewChannel', 'SendMessages'], true)) {
                            msg.channel.send("I tried deleting a message here, but I have no permissions!\n-# This is typically caused by bad bot permissions. Please give me the manage messages permission to enable this!");
                            console.log("[" + new Date().toLocaleTimeString() + `] [WARN] User \`${msg.author.id}\` (${msg.author.username}) tried sending a link in the channel \`${channel.id}\` (${channel.name}), but the bot does not have the necessary permissions to delete the message. The link was: \`${msg.content}\`.`);
                        } else {
                            console.log("[" + new Date().toLocaleTimeString() + `] [WARN] User \`${msg.author.id}\` (${msg.author.username}) tried sending a link in the channel \`${channel.id}\` (${channel.name}), but the bot does not have the necessary permissions to delete or send messages. The link was: \`${msg.content}\`.`);
                        }
                    }
                }
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

                    if (blacklistCheck) {
                        if (channel.permissionsFor(channel.guild.members.me).has(['ManageMessages'], true)) {
                            console.log("[" + new Date().toLocaleTimeString() + `] [INFO] User \`${msg.author.id}\` (${msg.author.username}) tried sending a blacklisted word in the channel \`${channel.id}\` (${channel.name}). The word was: \`${msg.content}\`.`);
                            msg.delete();
                            msg.channel.send("This word is blacklisted.");
                        } else if (channel.permissionsFor(channel.guild.members.me).has(['ViewChannel', 'SendMessages'], true)) {
                            msg.channel.send("I tried deleting a message here, but I have no permissions!\n-# This is typically caused by bad bot permissions. Please give me the manage messages permission to enable this!");
                            console.log("[" + new Date().toLocaleTimeString() + `] [WARN] User \`${msg.author.id}\` (${msg.author.username}) tried sending a blacklisted word in the channel \`${channel.id}\` (${channel.name}), but the bot does not have the necessary permissions to delete the message. The word was: \`${msg.content}\`.`);
                        } else {
                            console.log("[" + new Date().toLocaleTimeString() + `] [WARN] User \`${msg.author.id}\` (${msg.author.username}) tried sending a blacklisted word in the channel \`${channel.id}\` (${channel.name}), but the bot does not have the necessary permissions to delete or send messages. The word was: \`${msg.content}\`.`);
                        }
                    }
                }
            }
        })
    }
}