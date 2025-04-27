// modules/config.js
import { JSONFilePreset } from 'lowdb/node';
import { SlashCommandBuilder, Events } from 'discord.js';
import { Module } from '../classes/Module.js';

export default class ConfigModule extends Module {
    // 1) Bulk‐registration data
    static commandData = [
        new SlashCommandBuilder()
            .setName('setlog')
            .setDescription('Set the mod-log channel for this guild')
            .addChannelOption(opt =>
                opt.setName('channel')
                   .setDescription('Channel to receive logs')
                   .setRequired(true)
            )
    ];

    constructor(client) {
        super(client);
        this.initializeDatabase();
    }

    async initializeDatabase() {
        const defaultConfig = { guilds: {} };
        this.db = await JSONFilePreset('config.json', defaultConfig);
    }

    async handleSetLog(interaction) {
        const channel = interaction.options.getChannel('channel');
        this.db.data.guilds[interaction.guildId] = { logChannel: channel.id };
        await this.db.write();
        await interaction.reply(`✅ Log channel set to ${channel}`);
    }

    register() {
        this.client.on(Events.InteractionCreate, interaction => {
            if (!interaction.isChatInputCommand() || interaction.commandName !== 'setlog') return;
            this.handleSetLog(interaction);
        });
    }
}

export function registerModule(client) {
    const mod = new ConfigModule(client);
    mod.register();
}
