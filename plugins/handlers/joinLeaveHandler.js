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

const join = moderation.define('join', {
    channelId: {
        type: Sequelize.STRING,
        unique: true,
    },
    joinMsg: {
        type: Sequelize.STRING,
    },
    serverId: {
        type: Sequelize.STRING,
    },
});

const leave = moderation.define('leave', {
    channelId: {
        type: Sequelize.STRING,
        unique: true,
    },
    joinMsg: {
        type: Sequelize.STRING,
    },
    serverId: {
        type: Sequelize.STRING,
    },
});


const channelMessage = async function (ids, member) {
    const channel = member.guild.channels.cache.get(ids.channelId);
    if (!channel) return;
    let user = member.toString();
    let userName = member.displayName;
    let server = member.guild.name;
    let memberCount = member.guild.memberCount;
    let msg = "";
    for (let i = 0; i < ids.joinMsg.length; i++) {
        let tmpMsg = ids.joinMsg[i];
        if (ids.joinMsg[i] + ids.joinMsg[i + 1] == "${") {
            tmpMsg = ids.joinMsg[i];
            while (i < ids.joinMsg.length && ids.joinMsg[i] != "}") {
                i += 1;
                tmpMsg += ids.joinMsg[i];
            }
            switch (tmpMsg.toLowerCase()) {
                case "${user}":
                    tmpMsg = user;
                    break;
                case "${server}":
                    tmpMsg = server;
                    break;
                case "${membercount}":
                    tmpMsg = memberCount;
                    break;
                case "${username}":
                    tmpMsg = userName;
                    break;
            }
        }
        msg += tmpMsg;
    }
    channel.send(msg);

}

module.exports = {
    async execute() {
        client.on("guildMemberAdd", async member => {
            const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
            const joinList = await join.findAll({
                where: {
                    serverId: member.guild.id
                }
            });
            joinList.forEach(async ids => {
                await channelMessage(ids, member)
                await delay(500);
            })
        })
        client.on("guildMemberRemove", async member => {
            const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
            const leaveList = await leave.findAll({
                where: {
                    serverId: member.guild.id
                }
            });
            leaveList.forEach(async ids => {
                await channelMessage(ids, member)
                await delay(500);
            })
        })
    }
}