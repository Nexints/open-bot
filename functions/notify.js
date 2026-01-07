const { EmbedBuilder } = require('discord.js');

const Sequelize = require('sequelize');

const fundb = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'fundb.sqlite',
});

const notify = fundb.define('notify', {
    userId: {
        type: Sequelize.STRING,
    },
});

const dmNotify = async function (user, description, imageURL, messageURL, embedURL, embedIconURL, footerText, color) {
    const dmNotif = new EmbedBuilder()
        .setColor(color)
        .setTitle(`Notification!`)
        .setURL(messageURL)
        //.setAuthor({ name: 'Moderation Event', iconURL: embedIconURL, url: embedURL })
        .setDescription(description + "\n-# Turn notifs off with /notify!")
        .setThumbnail(embedURL)
        // .addFields({ name: 'This message has been deleted: ', value: `\`${msg.cleanContent}\``, inline: true })
        .setImage(imageURL)
        .setTimestamp()
        .setFooter({ text: footerText, iconURL: embedIconURL });
    try {
        const rowCount = await notify.findOne({ where: { userId: user.id } })
        if (rowCount === null) {
            await user.send({
                embeds: [dmNotif]
            });
        }
        return 0;
    } catch (error) {
        return error;
    }
}

module.exports = {
    dmNotify,
};