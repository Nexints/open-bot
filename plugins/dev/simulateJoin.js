const Sequelize = require('sequelize');

const { SlashCommandBuilder, MessageFlags } = require('discord.js');

const { devID, restart } = require('../../config.js');
const { readline, spawn, exitHandler } = require('../../index.js');

const moderation = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'moderation.sqlite',
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

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('simjoin')
        .setDescription('Simulates a join message. Bot owner only.'),
    async execute(interaction) {
        // interaction.user is the object representing the User who ran the command
        // interaction.member is the GuildMember object, which represents the user in the specific guild
        if (interaction.user.id == devID) {
            let member = interaction.member;
            const joinList = await join.findAll({
                where: {
                    serverId: member.guild.id
                }
            });
            joinList.forEach(async ids => {
                const channel = member.guild.channels.cache.get(ids.channelId);
                if (!channel) return;
                let user = member.toString();
                let server = member.guild.name;
                let memberCount = member.guild.memberCount;
                let msg = "";
                for(let i = 0; i < ids.joinMsg.length; i++){
                    let tmpMsg = ids.joinMsg[i];
                    if(ids.joinMsg[i] + ids.joinMsg[i+1] == "${"){
                        tmpMsg = ids.joinMsg[i];
                        while(i < ids.joinMsg.length && ids.joinMsg[i] != "}"){
                            i += 1;
                            tmpMsg += ids.joinMsg[i];
                        }
                        switch(tmpMsg.toLowerCase()){
                            case "${user}":
                                tmpMsg = user;
                                break;
                            case "${server}":
                                tmpMsg = server;
                                break;
                            case "${memberCount}":
                                tmpMsg = memberCount;
                                break;
                        }
                    }
                    msg += tmpMsg;
                }
                channel.send(msg);
            })
            await interaction.reply({ content: "Simulated a join message.", flags: MessageFlags.Ephemeral });
        } else {
            await interaction.reply({ content: "You don't have permission to do this.", flags: MessageFlags.Ephemeral });
        }
        return;
    }
};