import { JSONFilePreset } from 'lowdb/node';
import { SlashCommandBuilder, Events } from 'discord.js';

// 1) Initialize DB with default structure
const defaultConfig = { guilds: {} };
const db = await JSONFilePreset('../config.json', defaultConfig);

export function registerModule(bot) {
  // Register the slash command once on ready
  bot.once(Events.ClientReady, async () => {
    await bot.application.commands.create(
      new SlashCommandBuilder()
        .setName('setlog')
        .setDescription('Set the mod-log channel')
        .addChannelOption(opt => opt
          .setName('channel')
          .setDescription('Log channel')
          .setRequired(true))
    );
  });

  // Handle the interaction
  bot.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'setlog') return;
    const channel = interaction.options.getChannel('channel');
    // 2) Persist in db.data and write
    db.data.guilds[interaction.guildId] = { logChannel: channel.id };
    await db.write();
    await interaction.reply(`Log channel set to ${channel}`);
  });
}
