const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('kick')
		.setDescription('Kick a member!')
		.addStringOption(option =>
			option
				.setName('id')
				.setRequired(true)
				.setDescription('The ID to ban.'))
		.addStringOption(option =>
			option
				.setName('reason')
				.setRequired(true)
				.setDescription('The kick reason.')),
	async execute(interaction) {
		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
		if (interaction.guild != null) {
			if (interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
				let guildMember;
				try {
					guildMember = await interaction.guild.members.fetch(interaction.options.getString('id'));
				} catch (error) {
					if (error.rawError.message == "Unknown Member") {
						console.log("[" + DateFormatter.format(Date.now()) + `] [WARN] The user \`${interaction.user.id}\` (${interaction.user.username}) tried kicking ${guildMember.user.username} (${interaction.options.getString('id')}), but the member does not exist!`);
						await interaction.reply({ content: `The specified member does not exist or is already banned.`, flags: MessageFlags.Ephemeral });
					} else if (error.rawError.message == "Invalid Form Body") {
						console.log("[" + DateFormatter.format(Date.now()) + `] [WARN] The user \`${interaction.user.id}\` (${interaction.user.username}) tried kicking someone, but the command is malformed!`);
						await interaction.reply({ content: `The ID you inputted is not an ID.`, flags: MessageFlags.Ephemeral });
					} else {
						console.log("[" + DateFormatter.format(Date.now()) + `] [ERROR] ${error}`)
						await interaction.reply({ content: `Something seriously wrong happened. Error: ${error}`, flags: MessageFlags.Ephemeral })
					}
					return
				}
				if (guildMember.kickable) {
					if (interaction.member.roles.highest.comparePositionTo(guildMember.roles.highest) <= 0) {
						await interaction.reply({ content: `You don't have permission to kick ${guildMember.user.username}.`, flags: MessageFlags.Ephemeral });
					} else {
						let kickReason;
						if (interaction.options.getString('reason') == null) {
							kickReason = "No reason given.";
						} else {
							kickReason = interaction.options.getString('reason');
						}
						try{
							guildMember.send(`You have been kicked from ${interaction.guild.name} for: ${kickReason}`)
						}catch{
							console.log("[" + DateFormatter.format(Date.now()) + `] [ERROR] I can't send messages to ${guildMember.user.username}!`)
						}
						guildMember.kick({ reason: kickReason });
						await interaction.reply({ content: `Kicked member "${guildMember.user.username}" for reason ${kickReason}`, flags: MessageFlags.Ephemeral });
						console.log("[" + DateFormatter.format(Date.now()) + `] [INFO] The user \`${interaction.user.id}\` (${interaction.user.username}) kicked ${guildMember.user.username} (${interaction.options.getString('id')}).`);
					}
				} else {
					await interaction.reply({ content: `I don't have permission to kick ${guildMember.user.username}`, flags: MessageFlags.Ephemeral });
				}
			} else {
				await interaction.reply({ content: "You don't have kick permissions.", flags: MessageFlags.Ephemeral });
			}


		} else {
			await interaction.reply("This command does not work in DMs. Try again in a server!")
		}
		return;
	},
};