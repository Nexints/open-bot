module.exports = {
    async execute() {

        // Able to use sequelize databases in plugins and have them loaded.
        const Sequelize = require('sequelize');

        const fundb = new Sequelize('database', 'user', 'password', {
            host: 'localhost',
            dialect: 'sqlite',
            logging: false,
            // SQLite only
            storage: 'fundb.sqlite',
        });

        // Databases used.
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

        const notify = fundb.define('notify', {
            userId: {
                type: Sequelize.STRING,
                unique: true
            },
        });

        hugs.sync();
        pat.sync();
        hello.sync();
        boop.sync();
        notify.sync();
        console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Fun DBs loaded!`);
    }
}

