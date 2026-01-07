const { SlashCommandBuilder, MessageFlags, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { optOutIntChk } = require('../../functions/optOutIntChk.js');
const { workCheck } = require('../../functions/currency.js');
const { dmNotify } = require('../../functions/notify.js');
const { jobs, choiceCount } = require('./config.js')
const { devMode, devID, devMsg, prodMultiplier, devMultiplier, embedURL, embedIconURL, footerText, infoColor } = require('../../config.js');

const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'database.sqlite',
});

const currency = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'currency.sqlite',
});

module.exports = {
    cooldown: 1,
    data: new SlashCommandBuilder()
        .setName('apply')
        .setDescription('Apply for a job!'),
    async execute(interaction) {
        // interaction.user is the object representing the User who ran the command
        // interaction.member is the GuildMember object, which represents the user in the specific guild
        const response = await interaction.deferReply({
            withResponse: true,
        });
        let guildMember = interaction.user;
        let value = await optOutIntChk(guildMember);
        if (value == -1) {
            await interaction.editReply({
                content: "This person is opted out. Balance commands will not work.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        // random job code
        let chance = 0;
        let chances = [];
        for (let i = 0; i < jobs.length; i++) {
            chance += jobs[i].chance
            chances.push(jobs[i].chance);
        }
        let choices = [];
        for (let i = 0; i < choiceCount; i++) {
            let rng = Math.floor(Math.random() * chance);
            let choice = 0;
            let tmp = 0;
            while (tmp <= rng) {
                tmp += jobs[choice].chance;
                choice += 1;
            }
            choices.push([choice - 1, Math.floor(jobs[choice - 1].wage * ((Math.random() * 0.4) + 0.8))]);
        }
        let msg = "";
        for (let i = 0; i < choiceCount; i++) {
            msg += `\n\nJob ${i + 1}: ${jobs[choices[i][0]].name}`;
            msg += `\nWage: ${choices[i][1]}`;
            msg += `\nDays before fired: ${jobs[choices[i][0]].maxDays}`;
        }
        if (devMode) {
            msg += "\n-# " + devMsg;
        }
        const row = new ActionRowBuilder();
        for (let i = 0; i < choiceCount; i++) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(i.toString())
                    .setLabel('Apply for job ' + (i + 1))
                    .setStyle(ButtonStyle.Secondary)
            );
        }
        await interaction.editReply({
            content: "Job listings: " + msg,
            components: [row],
            withResponse: true,
            withReply: true
        });
        const collectorFilter = i => i.user.id === interaction.user.id;
        try {
            const confirmation = await response.resource.message.awaitMessageComponent({ filter: collectorFilter, time: 120_000 });

            let workUser = await workCheck(guildMember);
            let appliedJob = Number(confirmation.customId);
            workUser.wage = choices[appliedJob][1];
            workUser.lastWorked = Math.floor(Date.now() / 1000);
            workUser.jobId = choices[appliedJob][0];
            workUser.workCount = 0;
            await workUser.save()
            await confirmation.update({
                content: `You are now a(n) ${jobs[choices[appliedJob][0]].name}. Your starting salary is ${choices[appliedJob][1]} coins.`,
                components: [],
            })
            let result = await dmNotify(guildMember, `You are now a(n) ${jobs[choices[appliedJob][0]].name}.\nYour starting salary is ${choices[appliedJob][1]} coins.\nYou applied here: ${response.resource.message.url}!`, null, null, embedURL, embedIconURL, footerText, infoColor);
            if (result !== 0 && result.rawError.message != "Cannot send messages to this user") {
				throw result;
			}
        } catch (error) {
            if (error.name == "Error [InteractionCollectorError]") {
                await interaction.editReply({ content: 'Confirmation not received within 2 minutes, cancelling', components: [] });
            } else {
                throw error;
            }
        }
    },
};