const Sequelize = require('sequelize');

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
    value: {
        type: Sequelize.INTEGER,
    },
    name: {
        type: Sequelize.INTEGER,
    },
    multiplier: {
        type: Sequelize.INTEGER,
    },
    bankValue: {
        type: Sequelize.DOUBLE,
    },
});

const abbrevBalance = async function (coins) {
    // interaction.user is the object representing the User who ran the command
    // interaction.member is the GuildMember object, which represents the user in the specific guild
    let coinCount = coins;
    let coinValue = coinCount;
    let coinValues = ['K', 'M', 'B', 'T', 'Q', 'QT', 'S', 'SP', 'O', 'N', 'D', 'UD', 'DD', 'TD', 'QD', 'QND', 'SD', 'SPD', 'OD', 'ND', 'VT', 'UVT', 'DVT', 'TVT', 'QVT', 'QNVT', 'SVT', 'SPVT', 'OVT', 'NVT', 'T']
    let j = 0;
    coinCount = coinCount * 100;
    while (coinCount > 99999 && j < coinValues.length) {
        coinCount = Math.floor(coinCount / 1000);
        coinValue = (coinCount / 100) + " " + coinValues[j]
        j += 1;
    }
    j = 0;
    while (coinCount < -99999 && j < coinValues.length) {
        coinCount = Math.ceil(coinCount / 1000);
        coinValue = (coinCount / 100) + " " + coinValues[j]
        j += 1;
    }
    if(!(isNaN(Number(coinValue)))){
        coinValue = Math.floor(coinValue * 100) / 100
    }
    let values = {
        displayValue: coinValue,
        value: Math.floor(coins * 100) / 100
    }
    return values
}

module.exports = {
    abbrevBalance,
};