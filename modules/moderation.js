import { SlashCommandBuilder, Events, PermissionsBitField } from 'discord.js';

export function registerModule(bot) {
  // Register slash commands on startup
  bot.once(Events.ClientReady, async () => {
    // Kick command
    await bot.application.commands.create(
      new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user')
        .addUserOption(opt =>
          opt
            .setName('user')
            .setDescription('User to kick')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt
            .setName('reason')
            .setDescription('Reason for kick')
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers) // only visible to those with Kick Members
        .setDMPermission(false)
        .toJSON()
    );

    // Ban command
    await bot.application.commands.create(
      new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user')
        .addUserOption(opt =>
          opt
            .setName('user')
            .setDescription('User to ban')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt
            .setName('reason')
            .setDescription('Reason for ban')
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers) // only visible to those with Ban Members
        .setDMPermission(false)
        .toJSON()
    );
  });

  // Handle interactions
  bot.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand() || !interaction.guild) return;

    const { commandName, options, guild, user, member } = interaction;
    const targetMember = options.getMember('user');  // GuildMember
    const reason = options.getString('reason') || 'No reason provided';

    // Helper to send ephemeral errors
    const deny = msg =>
      interaction.reply({ content: msg, ephemeral: true });

    // Kick
    if (commandName === 'kick') {
      // 1) Check moderator perms
      if (!member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
        return deny("You don't have permission to kick members.");
      }
      // 2) Check bot perms
      if (!guild.members.me.permissions.has(PermissionsBitField.Flags.KickMembers)) {
        return deny("I don't have permission to kick members.");
      }
      // 3) Attempt kick
      try {
        await guild.members.kick(targetMember, reason);
      } catch (err) {
        console.error(err);
        return deny("Failed to kick—do I have a higher role than the target?");
      }
      // 4) Public confirmation
      return interaction.reply(
        `${targetMember.user.displayName} was kicked by ${user.displayName} for "${reason}"\r\nGET OUUUUUUTTTTTTT!!!!!!`
      );
    }

    // Ban
    if (commandName === 'ban') {
      if (!member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
        return deny("You don't have permission to ban members.");
      }
      if (!guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)) {
        return deny("I don't have permission to ban members.");
      }
      try {
        await guild.members.ban(targetMember, { reason, days: 1 });
      } catch (err) {
        console.error(err);
        return deny("Failed to ban—do I have a higher role than the target?");
      }
      return interaction.reply(
        `${targetMember.user.displayName} was banned by ${user.displayName} for "${reason}"\r\nGET OUUUUUUTTTTTTT!!!!!!`
      );
    }
  });
}
