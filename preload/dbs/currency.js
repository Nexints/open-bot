module.exports = {
    async execute() {

        // Able to use sequelize databases in plugins and have them loaded.
        const Sequelize = require('sequelize');

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

        work.sync();
        balance.sync();
        bank.sync();
        miscinfo.sync();
        console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Currency DBs loaded!`);
    }
}

