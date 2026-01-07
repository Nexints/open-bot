const fs = require('node:fs');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const Sequelize = require('sequelize');

const currency = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'currency.sqlite',
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

module.exports = {
    async post(verbose) {

        // Able to use sequelize databases in plugins and have them loaded.
        while (consoleOpen) {
            if (!fs.existsSync('./store')) {
                fs.mkdirSync('./store');
            }
            let date = 0;
            if (fs.existsSync('./store/lastInterestDate.txt')) {
                date = fs.readFileSync('./store/lastInterestDate.txt', { encoding: 'utf8' });
            }
            if (Math.floor(Date.now() / 1000) > Number(date) + 86400) {
                fs.writeFileSync('./store/lastInterestDate.txt', `${Math.floor(Date.now() / 1000)}`);
                let banks = await bank.findAll()
                let interest = 1.1;
                banks.forEach(element => {
                    if (element.value * interest < element.maxValue) {
                        element.value = Math.floor(element.value * interest);
                    }
                    element.save();
                });
                if(verbose){
                    console.log("[" + DateFormatter.format(Date.now()) + '] [INFO] Interest accumilated for all members.');
                }
            }
            await delay(60000);
        }
    }
}

