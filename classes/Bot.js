// classes/Bot.js
import { Client, Collection, GatewayIntentBits, Events, Partials } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

export class Bot {
    constructor() {
        dotenv.config();
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessageReactions    // needed for reaction events
            ],
            partials: [
                Partials.Message,
                Partials.Channel,
                Partials.Reaction                      // needed to fetch uncached reactions
            ]
        });
        this.client.commands = new Collection();
        this.modulesPath = this.getModulesPath();
    }

    getModulesPath() {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname  = path.dirname(__filename);
        return path.join(__dirname, '..', 'modules');
    }

    async loadModules() {
        const moduleFiles = fs.readdirSync(this.modulesPath).filter(f => f.endsWith('.js'));
        for (const file of moduleFiles) {
            const moduleUrl = new URL(`../modules/${file}`, import.meta.url).href;
            const mod = await import(moduleUrl);
            if (typeof mod.registerModule === 'function') {
                mod.registerModule(this.client);
            }
        }
    }

    /** Bulk‐overwrite all slash‐commands in the guild on startup */
    async deployCommands() {
        const all = [];
        const moduleFiles = fs.readdirSync(this.modulesPath).filter(f => f.endsWith('.js'));
        for (const file of moduleFiles) {
            const moduleUrl = new URL(`../modules/${file}`, import.meta.url).href;
            const mod = await import(moduleUrl);
            // If module default‐exports a class with static commandData
            if (mod.default?.commandData) {
                mod.default.commandData.forEach(b => all.push(b.toJSON()));
            }
            // Or if it exports commandData directly
            else if (Array.isArray(mod.commandData)) {
                mod.commandData.forEach(b => all.push(b.toJSON()));
            }
        }
        const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            { body: all }
        );
        console.log(`🔄 Deployed ${all.length} slash commands to guild ${process.env.GUILD_ID}`);
    }

    registerReadyEvent() {
        this.client.once(Events.ClientReady, c => {
            console.log(`Ready! Logged in as ${c.user.tag}`);
        });
    }

    async start() {
        await this.loadModules();
        await this.deployCommands();   // reload commands on every start
        this.registerReadyEvent();
        await this.client.login(process.env.BOT_TOKEN);
    }
}
