const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');

const Sequelize = require('sequelize');

const devdb = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'devdb.sqlite',
});

const moderation = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'moderation.sqlite',
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

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configuration commands. Only accessable to server admins.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('updates')
                .setDescription('Enables / disables updates from the bot owner to this channel.')
                .addStringOption(option =>
                    option
                        .setName('value')
                        .setRequired(true)
                        .setDescription('Choose to enable or disable updates here.')
                        .addChoices(
                            { name: 'Enable', value: 'enable' },
                            { name: 'Disable', value: 'disable' },
                        ))
                .addStringOption(option =>
                    option
                        .setName('channel')
                        .setRequired(true)
                        .setDescription('Which channel?')
                        .addChoices(
                            { name: 'update', value: 'update' },
                            { name: 'test', value: 'test' },
                            { name: 'announcements', value: 'announcements' },
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('blacklist')
                .setDescription('Configure the channel wide blacklist!')
                .addStringOption(option =>
                    option
                        .setName('value')
                        .setRequired(true)
                        .setDescription('Allow or disallow the blacklisted word / phrase in this channel.')
                        .addChoices(
                            { name: 'Allow', value: 'enable' },
                            { name: 'Disallow', value: 'disable' },
                        ))
                .addStringOption(option =>
                    option
                        .setName('strict')
                        .setRequired(true)
                        .setDescription('Strict or lenient?')
                        .addChoices(
                            { name: 'Strict', value: 'true' },
                            { name: 'Lenient', value: 'false' },
                        ))
                .addStringOption(option =>
                    option
                        .setName('word')
                        .setRequired(false)
                        .setDescription('Word or phrase to blacklist. Putting nothing here allows everything or disallows nothing.')
                ))
        .addSubcommand(subcommand =>
            subcommand
                .setName('links')
                .setDescription('Enable or disable links in this channel.')
                .addStringOption(option =>
                    option
                        .setName('value')
                        .setRequired(true)
                        .setDescription('Enable or disable links?')
                        .addChoices(
                            { name: 'Enable', value: 'enable' },
                            { name: 'Disable', value: 'disable' },
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('invites')
                .setDescription('Enable or disable invite links in this channel.')
                .addStringOption(option =>
                    option
                        .setName('value')
                        .setRequired(true)
                        .setDescription('Enable or disable invites?')
                        .addChoices(
                            { name: 'Enable', value: 'enable' },
                            { name: 'Disable', value: 'disable' },
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('logging')
                .setDescription('Enable or disable logging functionality for the entire server in this channel.')
                .addStringOption(option =>
                    option
                        .setName('value')
                        .setRequired(true)
                        .setDescription('Enable or disable logging?')
                        .addChoices(
                            { name: 'Enable', value: 'enable' },
                            { name: 'Disable', value: 'disable' },
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('modlog')
                .setDescription('Enable or disable moderator logging functionality in this channel.')
                .addStringOption(option =>
                    option
                        .setName('value')
                        .setRequired(true)
                        .setDescription('Enable or disable logging?')
                        .addChoices(
                            { name: 'Enable', value: 'enable' },
                            { name: 'Disable', value: 'disable' },
                        ))),
    async execute(interaction) {
        // interaction.user is the object representing the User who ran the command
        // interaction.member is the GuildMember object, which represents the user in the specific guild
        if (interaction.guild != null) {
            if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                switch (interaction.options.getSubcommand()) {
                    case "updates":
                        switch (interaction.options.getString('value')) {
                            case "enable":
                                try {
                                    if (interaction.channel.permissionsFor(interaction.guild.members.me).has(['ViewChannel', 'SendMessages'], true)) {
                                        const update = await updates.findAll({
                                            where: {
                                                channelId: interaction.channelId
                                            },
                                            attributes: ['channelId', 'channel']
                                        });
                                        let disabled = false;
                                        update.forEach(async updates => {
                                            if (updates.channel == interaction.options.getString('channel')) {
                                                disabled = true;
                                            }
                                        })
                                        if (disabled) {
                                            await interaction.reply({ content: "Updates are already enabled for this channel here.", flags: MessageFlags.Ephemeral });
                                            console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] The user \`${interaction.user.id}\` (${interaction.user.username}) tried enabling updates for the update channel \`${interaction.options.getString('channel')}\` in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`), but updates are already enabled here.`);
                                            return;
                                        }
                                        await updates.create({
                                            channelId: interaction.channelId,
                                            channel: interaction.options.getString('channel'),
                                            type: "channel",
                                        });
                                        await interaction.reply("Enabled updates here for channel " + interaction.options.getString('channel') + "!");
                                        console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] The user \`${interaction.user.id}\` (${interaction.user.username}) has enabled updates for the update channel \`${interaction.options.getString('channel')}\` in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`).`);
                                    } else {
                                        await interaction.reply("This bot doesn't have permission to perform this action in this channel.");
                                        console.log("[" + DateFormatter.format(Date.now()) + `] [WARN] The user \`${interaction.user.id}\` (${interaction.user.username}) tried enabling updates for the update channel \`${interaction.options.getString('channel')}\` in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`), but the bot can't view or send messages here.`);
                                    }

                                }
                                catch (error) {
                                    await interaction.reply("Something went wrong. Error: " + error);
                                    console.log("[" + DateFormatter.format(Date.now()) + `] [ERROR] An error happened while trying to enable updates for the update channel \`${interaction.options.getString('channel')}\` in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`). Error message: ${error}`);
                                }
                                break;
                            case "disable":
                                const rowCount = await updates.destroy({
                                    where: {
                                        channelId: interaction.channelId,
                                        channel: interaction.options.getString('channel'),
                                    }
                                });

                                if (!rowCount) {
                                    await interaction.reply({ content: "Updates are already disabled.", flags: MessageFlags.Ephemeral });
                                    console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] The user \`${interaction.user.id}\` (${interaction.user.username}) tried disabling update channel ${interaction.options.getString('channel')} in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`), but updates are already disabled here.`);
                                    return;
                                }

                                await interaction.reply("Disabled updates here for the channel " + interaction.options.getString('channel') + ".");
                                console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] The user \`${interaction.user.id}\` (${interaction.user.username}) disabled update channel ${interaction.options.getString('channel')} in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`).`);
                                break;
                        }
                        break;
                    case "links":
                        switch (interaction.options.getString('value')) {
                            case "enable":
                                const rowCount = await links.destroy({
                                    where: {
                                        channelId: interaction.channelId,
                                    }
                                });

                                if (!rowCount) {
                                    await interaction.reply({ content: "Linksare already enabled here.", flags: MessageFlags.Ephemeral });
                                    console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] The user \`${interaction.user.id}\` (${interaction.user.username}) tried enabling links in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`), but links are already enabled here.`);
                                    return;
                                }

                                await interaction.reply("Links are now enabled.");
                                console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] The user \`${interaction.user.id}\` (${interaction.user.username}) enabled links in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`).`);
                                break;
                            case "disable":
                                try {
                                    await links.create({
                                        channelId: interaction.channelId,
                                    });
                                    await interaction.reply({ content: "Links are now disabled." });
                                    if (interaction.channel.permissionsFor(interaction.guild.members.me).has(['ManageMessages'], true) == false && interaction.channel.permissionsFor(interaction.guild.members.me).has(['ViewChannel', 'SendMessages'], true)) {
                                        await interaction.channel.send({ content: "-# Please give me permissions to disable links! I need the permission \"Manage Messages\"." });
                                    };
                                    console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] The user \`${interaction.user.id}\` (${interaction.user.username}) disabled links in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`).`);
                                } catch (error) {
                                    if (error.name === 'SequelizeUniqueConstraintError') {
                                        await interaction.reply({ content: "Links are already disabled here.", flags: MessageFlags.Ephemeral });
                                        console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] The user \`${interaction.user.id}\` (${interaction.user.username}) tried disabling links in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`), but links are already disabled here.`);
                                        return;
                                    }
                                    console.log("[" + DateFormatter.format(Date.now()) + `] [ERROR] The user \`${interaction.user.id}\` (${interaction.user.username}) tried disabling links in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`), but something seriously wrong happened. Error: \'${error}\'`);
                                }
                                break;
                        }
                        break;
                    case "invites":
                        switch (interaction.options.getString('value')) {
                            case "enable":
                                const rowCount = await invites.destroy({
                                    where: {
                                        channelId: interaction.channelId,
                                    }
                                });

                                if (!rowCount) {
                                    await interaction.reply({ content: "Invites are already enabled here.", flags: MessageFlags.Ephemeral });
                                    console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] The user \`${interaction.user.id}\` (${interaction.user.username}) tried enabling invites in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`), but invites are already enabled here.`);
                                    return;
                                }

                                await interaction.reply("Invites are now enabled.");
                                console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] The user \`${interaction.user.id}\` (${interaction.user.username}) enabled invites in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`).`);
                                break;
                            case "disable":
                                try {
                                    await invites.create({
                                        channelId: interaction.channelId,
                                    });
                                    await interaction.reply({ content: "Invites are now disabled." });
                                    if (interaction.channel.permissionsFor(interaction.guild.members.me).has(['ManageMessages'], true) == false && interaction.channel.permissionsFor(interaction.guild.members.me).has(['ViewChannel', 'SendMessages'], true)) {
                                        await interaction.channel.send({ content: "-# Please give me permissions to disable links and invites! I need the permission \"Manage Messages\"." });
                                    };
                                    console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] The user \`${interaction.user.id}\` (${interaction.user.username}) disabled invites in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`).`);
                                } catch (error) {
                                    if (error.name === 'SequelizeUniqueConstraintError') {
                                        await interaction.reply({ content: "Invites are already disabled here.", flags: MessageFlags.Ephemeral });
                                        console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] The user \`${interaction.user.id}\` (${interaction.user.username}) tried disabling invites in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`), but invites are already disabled here.`);
                                        return;
                                    }
                                    console.log("[" + DateFormatter.format(Date.now()) + `] [ERROR] The user \`${interaction.user.id}\` (${interaction.user.username}) tried disabling invites in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`), but something seriously wrong happened. Error: \'${error}\'`);
                                }
                                break;
                        }
                        break;
                    case "logging":
                        switch (interaction.options.getString('value')) {
                            case "enable":
                                try {
                                    await logging.create({
                                        channelId: interaction.channelId,
                                    });
                                    await interaction.reply("Logging is now enabled in this channel, for the server.");
                                    console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] The user \`${interaction.user.id}\` (${interaction.user.username}) enabled logging in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`).`);
                                    if (interaction.channel.permissionsFor(interaction.guild.members.me).has(['ManageMessages'], true) == false && interaction.channel.permissionsFor(interaction.guild.members.me).has(['ViewChannel', 'SendMessages'], true)) {
                                        await interaction.channel.send({ content: "-# Please give me permissions to disable links and invites! I need the permission \"Manage Messages\"." });
                                    };
                                } catch (error) {
                                    if (error.name === 'SequelizeUniqueConstraintError') {
                                        await interaction.reply({ content: "Logging is already enabled here.", flags: MessageFlags.Ephemeral });
                                        console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] The user \`${interaction.user.id}\` (${interaction.user.username}) tried enabling logging in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`), but logging is already enabled here.`);
                                        return;
                                    }
                                    console.log("[" + DateFormatter.format(Date.now()) + `] [ERROR] The user \`${interaction.user.id}\` (${interaction.user.username}) tried enabling logging in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`), but something seriously wrong happened. Error: \'${error}\'`);
                                }
                                break;
                            case "disable":
                                const rowCount = await logging.destroy({
                                    where: {
                                        channelId: interaction.channelId,
                                    }
                                });
                                if (!rowCount) {
                                    await interaction.reply({ content: "Logging is already disabled here.", flags: MessageFlags.Ephemeral });
                                    console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] The user \`${interaction.user.id}\` (${interaction.user.username}) tried disabling logging in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`), but logging is already disabled here.`);
                                    return;
                                }
                                await interaction.reply({ content: "Logging is now disabled." });
                                console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] The user \`${interaction.user.id}\` (${interaction.user.username}) disabled logging in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`).`);
                                break;
                        }
                        break;
                    case "modlog":
                        switch (interaction.options.getString('value')) {
                            case "enable":
                                try {
                                    await modlog.create({
                                        channelId: interaction.channelId,
                                    });
                                    await interaction.reply("Mod logging is now enabled in this channel, for the server.");
                                    console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] The user \`${interaction.user.id}\` (${interaction.user.username}) enabled mod logging in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`).`);
                                    if (interaction.channel.permissionsFor(interaction.guild.members.me).has(['ManageMessages'], true) == false && interaction.channel.permissionsFor(interaction.guild.members.me).has(['ViewChannel', 'SendMessages'], true)) {
                                        await interaction.channel.send({ content: "-# Please give me permissions to disable links and invites! I need the permission \"Manage Messages\"." });
                                    };
                                } catch (error) {
                                    if (error.name === 'SequelizeUniqueConstraintError') {
                                        await interaction.reply({ content: "Mod logging is already enabled here.", flags: MessageFlags.Ephemeral });
                                        console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] The user \`${interaction.user.id}\` (${interaction.user.username}) tried enabling mod logging in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`), but logging is already enabled here.`);
                                        return;
                                    }
                                    console.log("[" + DateFormatter.format(Date.now()) + `] [ERROR] The user \`${interaction.user.id}\` (${interaction.user.username}) tried enabling mod logging in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`), but something seriously wrong happened. Error: \'${error}\'`);
                                }
                                break;
                            case "disable":
                                const rowCount = await modlog.destroy({
                                    where: {
                                        channelId: interaction.channelId,
                                    }
                                });
                                if (!rowCount) {
                                    await interaction.reply({ content: "Mod logging is already disabled here.", flags: MessageFlags.Ephemeral });
                                    console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] The user \`${interaction.user.id}\` (${interaction.user.username}) tried disabling mod logging in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`), but logging is already disabled here.`);
                                    return;
                                }
                                await interaction.reply({ content: "Mod logging is now disabled." });
                                console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] The user \`${interaction.user.id}\` (${interaction.user.username}) disabled mod logging in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`).`);
                                break;
                        }
                        break;
                    case "blacklist":
                        switch (interaction.options.getString('value')) {
                            case "enable":
                                let rowCount;
                                if (interaction.options.getString('word') === null) {
                                    rowCount = await blacklist.destroy({
                                        where: {
                                            channelId: interaction.channelId
                                        }
                                    });

                                    if (!rowCount) {
                                        console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] The user \`${interaction.user.id}\` (${interaction.user.username}) tried allowing all words in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`), but there is no blacklist.`);
                                        await interaction.reply({ content: "All words have already been allowed.", flags: MessageFlags.Ephemeral });
                                        return;
                                    }
                                    await interaction.reply("All words have been enabled.");
                                    console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] The user \`${interaction.user.id}\` (${interaction.user.username}) allowed all words in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`).`);
                                } else {
                                    rowCount = await blacklist.destroy({
                                        where: {
                                            channelId: interaction.channelId,
                                            word: interaction.options.getString('word')
                                        }
                                    });

                                    if (!rowCount) {
                                        await interaction.reply({ content: "The word has already been allowed", flags: MessageFlags.Ephemeral });
                                        console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] The user \`${interaction.user.id}\` (${interaction.user.username}) tried allowing the word "${interaction.options.getString('word')}" in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`), but the word is already allowed.`);
                                        return;
                                    }
                                    await interaction.reply("The word " + interaction.options.getString('word') + " has been enabled.");
                                    console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] The user \`${interaction.user.id}\` (${interaction.user.username}) allowed the word "${interaction.options.getString('word')}" in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`).`);
                                }

                                break;
                            case "disable":
                                try {
                                    if (interaction.options.getString('word') === null) {
                                        await interaction.reply({ content: "Nothing has been done. No word has been specified.", flags: MessageFlags.Ephemeral });
                                        console.log("[" + DateFormatter.format(Date.now()) + `] [WARN] The user \`${interaction.user.id}\` (${interaction.user.username}) tried disallowing an unspecified word in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`). No action has been done.`);
                                        return;
                                    }
                                    const blacklists = await blacklist.findAll({
                                        where: {
                                            channelId: interaction.channelId
                                        }
                                    });
                                    let disabled = false;
                                    blacklists.forEach(async blacklist => {
                                        if (blacklist.word == interaction.options.getString('word')) {
                                            disabled = true;
                                        }
                                    })
                                    if (disabled) {
                                        await interaction.reply({ content: "The word has already been blacklisted.", flags: MessageFlags.Ephemeral });
                                        console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] The user \`${interaction.user.id}\` (${interaction.user.username}) tried disabling the word "${interaction.options.getString('word')}" in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`), but the word was already disabled.`);
                                        return;
                                    }
                                    if (interaction.options.getString('strict') == 'true') {
                                        await blacklist.create({
                                            channelId: interaction.channelId,
                                            word: interaction.options.getString('word'),
                                            strict: true
                                        });
                                    } else {
                                        await blacklist.create({
                                            channelId: interaction.channelId,
                                            word: interaction.options.getString('word'),
                                            strict: false
                                        });
                                    }

                                    await interaction.reply({ content: "The word has now been blacklisted." });
                                    console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] The user \`${interaction.user.id}\` (${interaction.user.username}) disabled the word "${interaction.options.getString('word')}" in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`). Strict? ${interaction.options.getString('strict')}`);
                                }
                                catch (error) {

                                    await interaction.reply("Something went wrong. Error: " + error);
                                }
                                break;
                        }
                        break;
                    default:
                        await interaction.reply("This command is under construction.")
                }
            } else {

                await interaction.reply({ content: "You don't have permission to do this.\n\nAdmin commands are only accessable to admins.", flags: MessageFlags.Ephemeral });
            }


        } else {
            switch (interaction.options.getSubcommand()) {
                case "updates":
                    switch (interaction.options.getString('value')) {
                        case "enable":
                            try {
                                const update = await updates.findAll({
                                    where: {
                                        channelId: interaction.channelId
                                    },
                                    attributes: ['channelId', 'channel']
                                });
                                let disabled = false;
                                update.forEach(async updates => {
                                    if (updates.channel == interaction.options.getString('channel')) {
                                        disabled = true;
                                    }
                                })
                                if (disabled) {
                                    await interaction.reply({ content: "Updates are already enabled for this channel here.", flags: MessageFlags.Ephemeral });
                                    console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] The user \`${interaction.user.id}\` (${interaction.user.username}) tried enabling updates for the update channel \`${interaction.options.getString('channel')}\` in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`), but updates are already enabled here.`);
                                    return;
                                }
                                await updates.create({
                                    channelId: interaction.channelId,
                                    channel: interaction.options.getString('channel'),
                                    type: "dms",
                                });
                                await interaction.reply("Enabled updates here for channel " + interaction.options.getString('channel') + "!");
                                console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] The user \`${interaction.user.id}\` (${interaction.user.username}) has enabled updates for the update channel \`${interaction.options.getString('channel')}\` in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`).`);
                            }
                            catch (error) {
                                await interaction.reply("Something went wrong. Error: " + error);
                            }
                            break;
                        case "disable":
                            const rowCount = await updates.destroy({
                                where: {
                                    channelId: interaction.channelId,
                                }
                            });

                            if (!rowCount) {
                                await interaction.reply({ content: "Updates are already disabled.", flags: MessageFlags.Ephemeral });
                                console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] The user \`${interaction.user.id}\` (${interaction.user.username}) tried disabling update channel ${interaction.options.getString('channel')} in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`), but updates are already disabled here.`);
                                return;
                            }

                            await interaction.reply("Disabled updates here for all channels.");
                            console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] The user \`${interaction.user.id}\` (${interaction.user.username}) disabled update channel ${interaction.options.getString('channel')} in the Discord channel \`${interaction.channelId}\` (\`${interaction.channel.name}\`).`);
                            break;
                    }
                    break;
                default:
                    await interaction.reply("This command does not work in DMs. Try again in a server!");
            }
        }
        return;
    }
};