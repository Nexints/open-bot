const fs = require('node:fs');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const Sequelize = require('sequelize');

const moderation = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'moderation.sqlite',
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

module.exports = {
    async post(verbose) {

        // Able to use sequelize databases in plugins and have them loaded.
        while (consoleOpen) {
            if (!fs.existsSync('./store')) {
                fs.mkdirSync('./store');
            }
            let date = 0;
            if (fs.existsSync('./store/lastClearMessages.txt')) {
                date = fs.readFileSync('./store/lastClearMessages.txt', { encoding: 'utf8' });
            }
            if (Math.floor(Date.now() / 1000) > Number(date) + 30) {
                
                // deletes messages every 10 seconds
                fs.writeFileSync('./store/lastClearMessages.txt', `${Math.floor(Date.now() / 1000)}`);
                let deletedMessages = await messages.truncate();
            }
            await delay(10000);
        }
    }
}

