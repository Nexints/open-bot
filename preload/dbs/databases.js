module.exports = {
    async execute() {

        // Able to use sequelize databases in plugins and have them loaded.
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

        const devdb = new Sequelize('database', 'user', 'password', {
            host: 'localhost',
            dialect: 'sqlite',
            logging: false,
            // SQLite only
            storage: 'devdb.sqlite',
        });

        // Databases used.
        const enabled = sequelize.define('enabled', {
            intro: Sequelize.TEXT,
            traits: Sequelize.TEXT,
            backstory: Sequelize.TEXT,
            personality: Sequelize.TEXT,
            likes: Sequelize.TEXT,
            dislikes: Sequelize.TEXT,
            apiKey: Sequelize.STRING,
            channelId: {
                type: Sequelize.STRING,
                unique: true,
            },
        });

        const chatLog = devdb.define('chatLog', {
            channelId: Sequelize.STRING,
            content: Sequelize.TEXT,
            author: Sequelize.STRING
        });

        const updates = devdb.define('updates', {
            channelId: {
                type: Sequelize.STRING,
            },
            channel: {
                type: Sequelize.STRING,
            },
            type: {
                type: Sequelize.STRING,
            },
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

        const users = devdb.define('users', {
            author: {
                type: Sequelize.STRING,
                unique: true,
            },
            allowedChannel: {
                type: Sequelize.STRING,
            }
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

        const optOut = sequelize.define('optout', {
            author: {
                type: Sequelize.STRING,
                unique: true,
            }
        });

        enabled.sync();
        chatLog.sync();
        users.sync();
        updates.sync();
        optOut.sync();
        links.sync();
        invites.sync();
        logging.sync();
        modlog.sync();
        warnings.sync();
        messages.sync();
        blacklist.sync();
        const deletedMessages = await messages.truncate()
        console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] ${deletedMessages} messages deleted!`);
    }
}

