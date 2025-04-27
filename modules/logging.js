import { Events, EmbedBuilder } from 'discord.js';

export function registerModule(bot) {
  bot.on(Events.MessageDelete, async ev => {
    const channel = ev.channel;  // or fetch a dedicated log channel
    const embed = new EmbedBuilder()
      .setTitle('Message Deleted')
      .setDescription(`**Author:** ${ev.author.tag}\n**Channel:** ${channel.name}`)
      .addFields({ name: 'Content', value: ev.content || '*(no content)*' });
    channel.send({ embeds: [embed] });
  });
}
