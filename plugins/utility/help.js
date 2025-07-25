const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Need help tinkering?'),
	async execute(interaction) {
		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
		if (interaction.channel.permissionsFor(interaction.guild.members.me).has(['ViewChannel', 'SendMessages'], true)) {
			await interaction.reply({
				content: "So, you need help?\n# Help manual:"
			});
			await interaction.channel.send({
				content: "**Bot Owner commands:**\n- /dev clear: Clears something from the bot.\n- /dev update: Updates a channel with a message.\n- /dev allow: Allows another user to broadcast updates to a specific channel.\n- /dev deny: Denies another user all permissions to broadcast updates."
			})
			await interaction.channel.send({
				content: "**Admin commands:**\n- /config blacklist: Configures the channel blacklist with either a strict or lenient word block.\n- /config links: Configures whether links should be allowed here or not.\n- /config updates: Configures whether or not updates from the bot owner should be sent to that channel, and there are different channels to use.\n-# More admin commands are to be added at a later time."
			})
			await interaction.channel.send({
				content: "**Utility commands:**\n- /help: Provides this help menu.\n- /info: Provides an info manual about the bot.\n- /optout: Opts out of data collection. Moderation services still require your data.\n- /optin: Opts into data collection."
			})
			await interaction.channel.send({
				content: "**Fun commands:**\n- /badapple: Sends a bad apple YT URL. Only works if links aren't blacklisted."
			})

		}else{
			await interaction.reply({
				content: "This bot does not have the permissions to provide adedquete help.\n-# Please provide the bot with view channel and send messages permissions.",
				flags: MessageFlags.Ephemeral
			});
		}

	},
};