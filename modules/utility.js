// modules/utility.js
import { SlashCommandBuilder, Events, EmbedBuilder, PermissionsBitField } from 'discord.js';
import { Module } from '../classes/Module.js';

const numberEmojis = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];

export default class UtilityModule extends Module {
    // Bulk‐registered commands
    static commandData = [
      new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Create a poll with a question and multiple choices')
        .addStringOption(opt =>
          opt
            .setName('name')
            .setDescription('Poll ID (used for closing later)')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt
            .setName('title')
            .setDescription('The poll question to ask')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt
            .setName('choices')
            .setDescription('Comma-separated list of options (2–10)')
            .setRequired(true)
        ),
      new SlashCommandBuilder()
        .setName('closepoll')
        .setDescription('Close a poll and display its results')
        .addStringOption(opt =>
          opt
            .setName('name')
            .setDescription('The poll ID to close')
            .setRequired(true)
        )
    ];

    constructor(client) {
        super(client);
        this.polls = new Map();  // Map<pollName,{channelId,messageId,optionCount}>
    }

    // /poll handler
    async handlePoll(interaction) {
        const pollName   = interaction.options.getString('name', true);
        const pollTitle  = interaction.options.getString('title', true);
        const rawChoices = interaction.options.getString('choices', true);

        const choices = rawChoices
          .split(',')
          .map(c => c.trim())
          .filter(c => c);
        if (choices.length < 2 || choices.length > 10) {
            return interaction.reply({
                content: '🚫 You must provide between 2 and 10 comma-separated choices.',
                ephemeral: true
            });
        }

        // Build poll embed
        const embed = new EmbedBuilder()
            .setTitle(`📊 ${pollTitle}`)
            .setDescription('React to vote! One vote per user.')
            .setFooter({ text: `Poll ID: ${pollName}` })
            .setColor('Blue');
        choices.forEach((choice, i) => {
            embed.addFields({ name: `${numberEmojis[i]} ${choice}`, value: '\u200B' });
        });

        // Send and react
        const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
        for (let i = 0; i < choices.length; i++) {
            await msg.react(numberEmojis[i]);
        }

        // Store for closing and vote enforcement
        this.polls.set(pollName, {
            channelId:   msg.channel.id,
            messageId:   msg.id,
            optionCount: choices.length
        });
    }

    // /closepoll handler with title in results
    async handleClosePoll(interaction) {
        const pollName = interaction.options.getString('name', true);
        const info     = this.polls.get(pollName);
        if (!info) {
            return interaction.reply({
                content: `❌ No active poll found with ID "${pollName}".`,
                ephemeral: true
            });
        }

        // Fetch the original poll message
        const channel = await this.client.channels.fetch(info.channelId);
        const msg     = await channel.messages.fetch(info.messageId);

        // Extract the question from the original embed title
        const originalEmbed = msg.embeds[0];
        const pollTitle = originalEmbed.title?.replace(/^📊\s*/, '') || 'Poll';

        // Tally votes (subtract the bot’s own reaction)
        const results = [];
        for (let i = 0; i < info.optionCount; i++) {
            const emoji    = numberEmojis[i];
            const reaction = msg.reactions.cache.get(emoji);
            const count    = reaction ? (reaction.count - 1) : 0;
            results.push({ emoji, count });
        }

        // Remove reactions to lock the poll
        if (msg.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            await msg.reactions.removeAll().catch(() => {});
        }

        // Build results embed including the question
        const resultEmbed = new EmbedBuilder()
            .setTitle(`📊 Results: ${pollTitle}`)             // show the question here
            .setColor('Green');
        results.forEach(r => {
            const label = msg.embeds[0].fields
                .find(f => f.name.startsWith(r.emoji))?.name
                || r.emoji;
            resultEmbed.addFields({ name: label, value: `${r.count} vote${r.count===1?'':'s'}` });
        });

        await interaction.reply({ embeds: [resultEmbed] });
        this.polls.delete(pollName);
    }

    // Enforce one vote per user
    async handleReactionAdd(reaction, user) {
        if (user.bot) return;
        const info = Array.from(this.polls.values())
          .find(v => v.messageId === reaction.message.id);
        if (!info) return;

        // Remove other reactions by this user
        for (let i = 0; i < info.optionCount; i++) {
            const emoji = numberEmojis[i];
            if (emoji === reaction.emoji.name) continue;
            const other = reaction.message.reactions.cache.get(emoji);
            if (other) {
                await other.users.remove(user.id).catch(() => {});
            }
        }
    }

    register() {
        // Slash commands
        this.client.on(Events.InteractionCreate, interaction => {
            if (!interaction.isChatInputCommand()) return;
            switch (interaction.commandName) {
                case 'poll':
                    this.handlePoll(interaction).catch(console.error);
                    break;
                case 'closepoll':
                    this.handleClosePoll(interaction).catch(console.error);
                    break;
            }
        });
        // One-vote enforcement
        this.client.on(Events.MessageReactionAdd, this.handleReactionAdd.bind(this));
    }
}

export function registerModule(client) {
    const mod = new UtilityModule(client);
    mod.register();
}
