const Sequelize = require('sequelize');
const { expChance, expMaxGain } = require('./../plugins/currency/config.js');
const { dmNotify } = require('./notify.js');
const { embedURL, embedIconURL, footerText, infoColor, devMode, devID, devMsg } = require('../config.js');

const currency = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'currency.sqlite',
});

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

const balanceCheck = async function (guildMember) {
    await balance.sync();
    let balanceUser = await balance.findOne({
        where: {
            userId: guildMember.id
        }
    })
    if (balanceUser === null) {
        await balance.create({
            userId: guildMember.id,
            value: 0,
            name: guildMember.username,
            multiplier: 1, // use the default multiplier when at null for compatibility, can be modified per person
        })
        balanceUser = await balance.findOne({
            where: {
                userId: guildMember.id
            }
        })
    }
    return balanceUser
}

const bankCheck = async function (guildMember) {
    await bank.sync();
    let bankUser = await bank.findOne({
        where: {
            userId: guildMember.id
        }
    })
    if (bankUser === null) {

        // makes new bank entry
        await bank.create({
            userId: guildMember.id,
            value: 0,
            name: guildMember.username,
            maxValue: 1000000,
        })
        bankUser = await bank.findOne({
            where: {
                userId: guildMember.id
            }
        })
    }
    return bankUser
}

const miscCheck = async function (guildMember) {
    await miscinfo.sync();
    let miscInfo = await miscinfo.findOne({
        where: {
            userId: guildMember.id
        }
    })
    if (miscInfo === null) {

        await miscinfo.create({
            userId: guildMember.id,
            name: guildMember.username,
            exp: 0,
            level: 1,
            nextLevel: 5,
            lastRobbed: 0,
            robbable: true,
        })
        miscInfo = await miscinfo.findOne({
            where: {
                userId: guildMember.id
            }
        })
    }
    return miscInfo
}

const workCheck = async function (guildMember) {
    await work.sync();
    let workInfo = await work.findOne({
        where: {
            userId: guildMember.id
        }
    })
    if (workInfo === null) {

        await work.create({
            userId: guildMember.id,
            name: guildMember.username,
            jobId: -1,
            wage: 0,
            lastWorked: 0,
            workCount: 0
        })
        workInfo = await work.findOne({
            where: {
                userId: guildMember.id
            }
        })
    }
    return workInfo
}

const expGain = async function (guildMember) {
    let user = await miscCheck(guildMember);
    if (Math.random() > expChance) {
        user.exp += (Math.floor(Math.random() * expMaxGain) + 1);
        if (user.exp >= user.nextLevel) {
            user.exp = 0;
            user.level += 1;
            user.nextLevel = Math.floor(user.nextLevel * 1.09051) + 1;
            let bankUser = await bankCheck(guildMember);
            bankUser.maxValue *= 1.1;
            await bankUser.save();
            await user.save();
            let result = await dmNotify(guildMember, `You gained an additional level!\nYou are now level ${user.level}.`, null, null, embedURL, embedIconURL, footerText, infoColor);
            if (result !== 0 && result.rawError.message != "Cannot send messages to this user") {
				throw result;
			}
            return user.level;
        }
        await user.save();
    }
    return 0;
}

const reset = async function () {
    await currency.truncate();
}

module.exports = {
    balanceCheck,
    bankCheck,
    miscCheck,
    workCheck,
    expGain,
    reset,
};