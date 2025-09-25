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
        });
        
        const pat = fundb.define('pat', {
            userId: {
                type: Sequelize.STRING,
            },
            pattedId: {
                type: Sequelize.STRING,
            },
        });

        const kiss = fundb.define('kiss', {
            userId: {
                type: Sequelize.STRING,
            },
            kissedId: {
                type: Sequelize.STRING,
            },
        });

        const hello = fundb.define('hello', {
            userId: {
                type: Sequelize.STRING,
            },
            helloId: {
                type: Sequelize.STRING,
            },
        });

        hugs.sync();
        pat.sync();
        kiss.sync();
        hello.sync();
        console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] Fun DBs loaded!`);
    }
}

