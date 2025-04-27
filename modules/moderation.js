// modules/moderation.js
import { SlashCommandBuilder, Events, PermissionsBitField } from 'discord.js';
import { Module } from '../classes/Module.js';

export default class ModerationModule extends Module {
    // Bulk‐deployed slash commands
    static commandData = [
        new SlashCommandBuilder()
            .setName('kick')
            .setDescription('Kick a user')
            .addUserOption(o => o
                .setName('user')
                .setDescription('Target user')
                .setRequired(true))
            .addStringOption(o => o
                .setName('reason')
                .setDescription('Reason')                
                .setRequired(false)
            ),
        new SlashCommandBuilder()
            .setName('ban')
            .setDescription('Ban a user')
            .addUserOption(o => o
                .setName('user')
                .setDescription('Target user')
                .setRequired(true))
            .addStringOption(o => o
                .setName('reason')
                .setDescription('Reason')
                .setRequired(false)
            )
    ];

    constructor(client) {
        super(client);
        this.commands = {
            kick: this.handleKick.bind(this),
            ban:  this.handleBan.bind(this)
        };
    }

    async handleKick(interaction) {
        const member = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return interaction.reply({ content: '❌ You lack permission to kick members.', ephemeral: true });
        }
        await member.kick(reason);
        const targetName    = member.displayName;
        const moderatorName = interaction.member.displayName;
        await interaction.reply(`${targetName} was kicked by ${moderatorName} for ${reason}\r\nGET OUUUUUUUUTTTTTTTT!!!!`);
    }

    async handleBan(interaction) {
        const user   = interaction.options.getUser('user');
        const member = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.reply({ content: '❌ You lack permission to ban members.', ephemeral: true });
        }
        await interaction.guild.bans.create(user.id, { reason });
        const targetName    = member ? member.displayName : user.tag;
        const moderatorName = interaction.member.displayName;
        await interaction.reply(`${targetName} was banned by ${moderatorName} for ${reason}\r\nGET OUUUUUUUUTTTTTTTT!!!!`);
    }

    register() {
        this.client.on(Events.InteractionCreate, interaction => {
            if (!interaction.isChatInputCommand() || !interaction.guild) return;
            const handler = this.commands[interaction.commandName];
            if (handler) handler(interaction);
        });
    }
}

export function registerModule(client) {
    const mod = new ModerationModule(client);
    mod.register();
}
