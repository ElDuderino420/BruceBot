// modules/rolePersistence.js
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { Events } from 'discord.js';
// Default structure
const defaultData = { roles: {} };

// 1) Initialize LowDB with default schema
const file    =  './roles.json';
const adapter = new JSONFile(file);
const db      = new Low(adapter, defaultData);

(async () => {
  await db.read();
  // In case the file existed but was empty:
  db.data ||= defaultData;
  await db.write();
})();

export function registerModule(bot) {
  // 2) Save roles on leave
  bot.on(Events.GuildMemberRemove, async (member) => {
    const userId = member.id;
    const roleIds = member.roles.cache
      .filter(r => r.id !== member.guild.id)
      .map(r => r.id);
    db.data.roles[userId] = roleIds;
    await db.write();
  });

  // 3) Restore roles on join
  bot.on(Events.GuildMemberAdd, async (member) => {
    const userId = member.id;
    const saved  = db.data.roles[userId];
    if (Array.isArray(saved) && saved.length) {
      for (const roleId of saved) {
        const role = member.guild.roles.cache.get(roleId);
        if (role) {
          try {
            await member.roles.add(role, 'Restoring persisted roles');
          } catch (err) {
            console.warn(`Failed to restore role ${roleId} to ${userId}:`, err);
          }
        }
      }
      delete db.data.roles[userId];
      await db.write();
    }
  });
}
