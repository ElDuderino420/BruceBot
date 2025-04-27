import { SlashCommandBuilder, Events, PermissionsBitField } from 'discord.js';
import { Module } from '../classes/Module.js';

export class ModerationModule extends Module {
    constructor(client) {
        super(client);
        this.commands = {
            kick: this.handleKick.bind(this),
            ban: this.handleBan.bind(this)
        };
    }

    async registerCommands() {
        await this.client.application.commands.create(
            new SlashCommandBuilder()
                .setName('kick')
                .setDescription('Kick a user')
                .addUserOption(opt =>
                    opt.setName('user')
                        .setDescription('User to kick')
                        .setRequired(true)
                )
                .addStringOption(opt =>
                    opt.setName('reason')
                        .setDescription('Reason for kick')
                )
                .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers)
                .setDMPermission(false)
                .toJSON()
        );

        // Similar for ban command...
    }

    async handleKick(interaction) {
        const { options, guild, user, member } = interaction;
        const targetMember = options.getMember('user');  // GuildMember
        const reason = options.getString('reason') || 'No reason provided';

        // Helper to send ephemeral errors
        const deny = msg =>
            interaction.reply({ content: msg, ephemeral: true });

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

    async handleBan(interaction) {
        const { options, guild, user, member } = interaction;
        const targetMember = options.getMember('user');  // GuildMember
        const reason = options.getString('reason') || 'No reason provided';

        // Helper to send ephemeral errors
        const deny = msg =>
            interaction.reply({ content: msg, ephemeral: true });

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

    register() {
        this.client.once(Events.ClientReady, () => this.registerCommands());
        this.client.on(Events.InteractionCreate, interaction => {
            if (!interaction.isChatInputCommand() || !interaction.guild) return;
            const handler = this.commands[interaction.commandName];
            if (handler) handler(interaction);
        });
    }
}

export function registerModule(client) {
    const module = new ModerationModule(client);
    module.register();
}
