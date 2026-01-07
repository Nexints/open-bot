const Sequelize = require('sequelize');

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

const optOutIntChk = async function (guildMember, id) {
    // interaction.user is the object representing the User who ran the command
    // interaction.member is the GuildMember object, which represents the user in the specific guild

    let optedOut = false;
    const optOutList = await optOut.findAll({ attributes: ['author'] });
    optOutList.forEach(optOutID => {
        if (optOutID.author == guildMember.id) {
            optedOut = true;
        }
    })
    if (optedOut) {
        return -1;
    }
    return 0;
}

module.exports = {
    optOutIntChk,
};