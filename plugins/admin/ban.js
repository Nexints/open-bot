const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('ban')
		.setDescription('Ban a member!')
		.addStringOption(option =>
			option
				.setName('id')
				.setRequired(true)
				.setDescription('The ID to ban.'))
		.addStringOption(option =>
			option
				.setName('reason')
				.setRequired(true)
				.setDescription('The ban reason.')),
	async execute(interaction) {
		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
		if (interaction.guild != null) {
			if (interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
				let guildMember;
				try {
					guildMember = await interaction.guild.members.fetch(interaction.options.getString('id'));
				} catch (error) {
					if (error.rawError.message == "Unknown Member") {
						console.log("[" + new Date().toLocaleTimeString() + `] [WARN] The user \`${interaction.user.id}\` (${interaction.user.username}) tried banning ${guildMember.user.username} (${interaction.options.getString('id')}), but the member does not exist!`);
						await interaction.reply({ content: `The specified member does not exist or is already banned.`, flags: MessageFlags.Ephemeral });
					} else if (error.rawError.message == "Invalid Form Body") {
						console.log("[" + new Date().toLocaleTimeString() + `] [WARN] The user \`${interaction.user.id}\` (${interaction.user.username}) tried banning someone, but the command is malformed!`);
						await interaction.reply({ content: `The ID you inputted is not an ID.`, flags: MessageFlags.Ephemeral });
					} else {
						console.log("[" + new Date().toLocaleTimeString() + `] [ERROR] ${error}`)
						await interaction.reply({ content: `Something seriously wrong happened. Error: ${error}`, flags: MessageFlags.Ephemeral })
					}
					return
				}
				if (guildMember.bannable) {
					if (interaction.member.roles.highest.comparePositionTo(guildMember.roles.highest) <= 0) {
						await interaction.reply({ content: `You don't have permission to ban ${guildMember.user.username}.`, flags: MessageFlags.Ephemeral });
					} else {
						let banReason;
						if (interaction.options.getString('reason') = null) {
							banReason = "No reason given.";
						} else {
							banReason = interaction.options.getString('reason');
						}
						guildMember.send(`You have been banned from ${interaction.guild.name} for: ${banReason}`).catch(console.log("[" + new Date().toLocaleTimeString() + `] [ERROR] I can't send messages to ${guildMember.user.username}!`));
						guildMember.ban({ reason: banReason });
						await interaction.reply({ content: `Banned member "${guildMember.user.username}" for reason ${kickReason}`, flags: MessageFlags.Ephemeral });
					}
				} else {
					await interaction.reply({ content: `I don't have permission to ban ${guildMember.user.username}`, flags: MessageFlags.Ephemeral });
				}
			} else {
				await interaction.reply({ content: "You don't have ban permissions.", flags: MessageFlags.Ephemeral });
			}


		} else {
			await interaction.reply("This command does not work in DMs. Try again in a server!")
		}
		return;
	},
};