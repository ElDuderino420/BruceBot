import { Client, Collection, GatewayIntentBits, Events } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

export class Bot {
    constructor() {
        dotenv.config();
        this.client = new Client({ 
            intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] 
        });
        this.client.commands = new Collection();
        this.modulesPath = this.getModulesPath();
    }

    getModulesPath() {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
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

    registerReadyEvent() {
        this.client.once(Events.ClientReady, c => {
            console.log(`Ready! Logged in as ${c.user.tag}`);
        });
    }

    async start() {
        await this.loadModules();
        this.registerReadyEvent();
        await this.client.login(process.env.BOT_TOKEN);
    }
}