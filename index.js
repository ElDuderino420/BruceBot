import { Client, Collection, GatewayIntentBits, Events } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();
const bot = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
bot.commands = new Collection();

const __filename = fileURLToPath(import.meta.url); const __dirname = path.dirname(__filename);
const modulesDir = path.join(__dirname, 'modules');
for (const file of fs.readdirSync(modulesDir).filter(f => f.endsWith('.js'))) {
    const moduleUrl = new URL(`./modules/${file}`, import.meta.url).href; const mod = await import(moduleUrl);
    if (typeof mod.registerModule === 'function') {
        mod.registerModule(bot);
    }
}

bot.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

bot.login(process.env.BOT_TOKEN);
