const { SlashCommandBuilder, MessageFlags } = require('discord.js');

const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'database.sqlite',
});

const fundb = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'fundb.sqlite',
});

const optOut = sequelize.define('optout', {
    author: {
        type: Sequelize.STRING,
        unique: true,
    }
});

const users = sequelize.define('users', {
    rulesViewed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    author: {
        type: Sequelize.STRING,
        unique: true,
    },
    allowedChannel: {
        type: Sequelize.STRING,
    }
});

const hugs = fundb.define('hugs', {
    userId: {
        type: Sequelize.STRING,
    },
    huggedId: {
        type: Sequelize.STRING,
    },
    value: {
        type: Sequelize.INTEGER,
    },
});

const kiss = fundb.define('kiss', {
    userId: {
        type: Sequelize.STRING,
    },
    kissedId: {
        type: Sequelize.STRING,
    },
    value: {
        type: Sequelize.INTEGER,
    },
});

const hello = fundb.define('hello', {
    userId: {
        type: Sequelize.STRING,
    },
    helloId: {
        type: Sequelize.STRING,
    },
    value: {
        type: Sequelize.INTEGER,
    },
});

const pat = fundb.define('pat', {
    userId: {
        type: Sequelize.STRING,
    },
    pattedId: {
        type: Sequelize.STRING,
    },
    value: {
        type: Sequelize.INTEGER,
    },
});

const boop = fundb.define('boop', {
    userId: {
        type: Sequelize.STRING,
    },
    boopId: {
        type: Sequelize.STRING,
    },
    value: {
        type: Sequelize.INTEGER,
    },
});


const chatLog = sequelize.define('chatLog', {
    channelId: Sequelize.STRING,
    content: Sequelize.TEXT,
    author: Sequelize.STRING
});

const currency = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'currency.sqlite',
});

// Databases used.
const balance = currency.define('balance', {
    userId: {
        type: Sequelize.STRING,
    },
    name: {
        type: Sequelize.STRING,
    },
    value: {
        type: Sequelize.DOUBLE,
    },
    multiplier: {
        type: Sequelize.DOUBLE,
    },
    bankValue: {
        type: Sequelize.DOUBLE,
    },
});

const bank = currency.define('bank', {
    userId: {
        type: Sequelize.STRING,
    },
    name: {
        type: Sequelize.STRING,
    },
    value: {
        type: Sequelize.DOUBLE,
    },
    maxValue: {
        type: Sequelize.DOUBLE,
    }
});

const miscinfo = currency.define('miscinfo', {
    userId: {
        type: Sequelize.STRING,
    },
    name: {
        type: Sequelize.STRING,
    },
    exp: {
        type: Sequelize.DOUBLE,
    },
    level: {
        type: Sequelize.DOUBLE,
    },
    nextLevel: {
        type: Sequelize.DOUBLE,
    },
    lastRobbed: {
        type: Sequelize.STRING,
    },
    robbable: {
        type: Sequelize.BOOLEAN,
    },
});

const work = currency.define('work', {
    userId: {
        type: Sequelize.STRING,
    },
    name: {
        type: Sequelize.STRING,
    },
    jobId: {
        type: Sequelize.INTEGER,
    },
    wage: {
        type: Sequelize.DOUBLE,
    },
    lastWorked: {
        type: Sequelize.DOUBLE,
    },
    workCount: {
        type: Sequelize.INTEGER,
    }
});

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('opt-out')
        .setDescription('Opt out from data collection. Disables certain features and anonymizes all future data.'),
    async execute(interaction) {
        try {
            await interaction.deferReply();
            await chatLog.sync();
            await hugs.sync();
            await pat.sync();
            await kiss.sync();
            await hello.sync();
            await users.sync();
            await currency.sync();
            await boop.sync();
            await balance.sync();
            await bank.sync();
            await miscinfo.sync();
            await work.sync();
            await chatLog.destroy({ where: { author: interaction.user.id } })
            await users.destroy({ where: { author: interaction.user.id } })
            await hugs.destroy({ where: { userId: interaction.user.id } })
            await hugs.destroy({ where: { huggedId: interaction.user.id } })
            await kiss.destroy({ where: { userId: interaction.user.id } })
            await kiss.destroy({ where: { kissedId: interaction.user.id } })
            await hello.destroy({ where: { userId: interaction.user.id } })
            await hello.destroy({ where: { helloId: interaction.user.id } })
            await pat.destroy({ where: { userId: interaction.user.id } })
            await pat.destroy({ where: { pattedId: interaction.user.id } })
            await boop.destroy({ where: { userId: interaction.user.id } })
            await boop.destroy({ where: { boopId: interaction.user.id } })
            await balance.destroy({ where: { userId: interaction.user.id } })
            await bank.destroy({ where: { userId: interaction.user.id } })
            await miscinfo.destroy({ where: { userId: interaction.user.id } })
            await work.destroy({ where: { userId: interaction.user.id } })

            await optOut.create({
                author: interaction.user.id,
            });
            await interaction.editReply({
                content: "Opted out from data collection! - Note that your ID is still stored to opt you out.\n\n-# Certain services will not work for you. Moderation functions and notification settings in this bot still require your username and / or ID.",
                flags: MessageFlags.Ephemeral
            });
            console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] ${interaction.user.id} has opted out.`);
        }
        catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                await interaction.editReply({ content: "Already opted out.", flags: MessageFlags.Ephemeral });
                console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] ${interaction.user.id} has already opted out.`);
                return
            }
            throw error;
        }
    },
};