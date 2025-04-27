// modules/rolePersistence.js
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { Events } from 'discord.js';
import { Module } from '../classes/Module.js';

export class RolePersistenceModule extends Module {
    constructor(client) {
        super(client);
        this.initializeDatabase();
    }

    async initializeDatabase() {
        const defaultData = { roles: {} };
        const file = './roles.json';
        const adapter = new JSONFile(file);
        this.db = new Low(adapter, defaultData);

        await this.db.read();
        this.db.data ||= defaultData;
        await this.db.write();
    }

    async handleMemberRemove(member) {
        const userId = member.id;
        const roleIds = member.roles.cache
            .filter(r => r.id !== member.guild.id)
            .map(r => r.id);
            
        this.db.data.roles[userId] = roleIds;
        await this.db.write();
    }

    async handleMemberAdd(member) {
        const userId = member.id;
        const saved = this.db.data.roles[userId];

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
            delete this.db.data.roles[userId];
            await this.db.write();
        }
    }

    register() {
        this.client.on(Events.GuildMemberRemove, this.handleMemberRemove.bind(this));
        this.client.on(Events.GuildMemberAdd, this.handleMemberAdd.bind(this));
    }
}

export function registerModule(client) {
    const module = new RolePersistenceModule(client);
    module.register();
}
