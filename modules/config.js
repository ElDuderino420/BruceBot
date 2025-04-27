import { JSONFilePreset } from 'lowdb/node';
import { SlashCommandBuilder, Events } from 'discord.js';
import { Module } from '../classes/Module.js';

export class ConfigModule extends Module {
    constructor(client) {
        super(client);
        this.initializeDatabase();
    }

    async initializeDatabase() {
        const defaultConfig = { guilds: {} };
        this.db = await JSONFilePreset('../config.json', defaultConfig);
    }

    async registerCommands() {
        await this.client.application.commands.create(
            new SlashCommandBuilder()
                .setName('setlog')
                .setDescription('Set the mod-log channel')
                .addChannelOption(opt => opt
                    .setName('channel')
                    .setDescription('Log channel')
                    .setRequired(true))
                .toJSON()
        );
    }

    async handleSetLog(interaction) {
        const channel = interaction.options.getChannel('channel');
        this.db.data.guilds[interaction.guildId] = { logChannel: channel.id };
        await this.db.write();
        await interaction.reply(`Log channel set to ${channel}`);
    }

    register() {
        this.client.once(Events.ClientReady, () => this.registerCommands());
        this.client.on(Events.InteractionCreate, interaction => {
            if (!interaction.isChatInputCommand() || interaction.commandName !== 'setlog') return;
            this.handleSetLog(interaction);
        });
    }
}

export function registerModule(client) {
    const module = new ConfigModule(client);
    module.register();
}
