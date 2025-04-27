# BruceBot

A modular, object-oriented Discord bot built with **Discord.js v14**, featuring:

- 🔨 **Dynamic module loading** & automatic slash‐command deployment on startup  
- 🛠️ **Moderation**: `/kick`, `/ban` with detailed audit replies  
- ⚙️ **Configuration**: `/setlog` to choose your mod-log channel  
- 📝 **Role Persistence**: remembers roles on leave, restores on rejoin  
- 🔍 **Logging**: auto-logs deleted messages to your designated channel  
- 📊 **Polling**: `/poll` (with ID, question, multi-choice, one vote/user) & `/closepoll` (tallies & displays results)  

---

## 📋 Features & Commands

### Moderation Module

| Command | Description                                                  |
| :------ | :----------------------------------------------------------- |
| `/kick`   | Kick a user. Replies:  
`[UserDisplay] was kicked by [Moderator] for [Reason]`       |
| `/ban`    | Ban a user. Replies:  
`[UserDisplay] was banned by [Moderator] for [Reason]`       |

> **Permission checks**: only users with Kick/Ban permissions can invoke.

---

### Configuration Module

| Command       | Description                              |
| :------------ | :--------------------------------------- |
| `/setlog`       | Sets the server’s mod-log text channel. |

> **Persists** per-guild in `config.json` via Lowdb.

---

### Role Persistence Module

- **On Leave**: saves all non-`@everyone` roles to `roles.json`.  
- **On Join**: reassigns saved roles, then cleans up.

_No slash commands; runs automatically._

---

### Logging Module

- Listens for **message deletions** and reposts an embed in the mod-log channel:

---

### Utility Module (Polling)

| Command               | Description                                                                                                        |
| :-------------------- | :----------------------------------------------------------------------------------------------------------------- |
| `/poll name:ID title:Question choices:Opt1,Opt2,…`    | Creates a multi-choice poll (2–10 options). One-vote-per-user enforced via reactions. |
| `/closepoll name:ID`  | Closes that poll, removes reactions, and displays vote counts in a results embed.                                |

- Polls are tracked in-memory (reset on bot restart).  
- Results embed shows the original **question** and tallies for each option.

---

## 🚀 Installation & Setup

1. **Clone** the repo  
 ```bash
 git clone https://github.com/ElDuderino420/BruceBot.git
 cd BruceBot/discord-bot-node
```
2. Install dependencies
`npm install`
3. Environment
Create a .env at the project root with:
```
BOT_TOKEN=your_discord_bot_token
CLIENT_ID=your_application_id
GUILD_ID=your_development_guild_id
```
4. Run the bot
node index.js

🧩 Architecture  
**classes/Bot.js**  
Orchestrates the Discord client (intents + partials), module loading, and slash-command deployment via REST on every start.

**classes/Module.js**  
Base class defining `register()` for all feature modules.

**modules/**  
Each feature (`moderation.js`, `config.js`, `rolePersistence.js`, `logging.js`, `utility.js`) registers its own slash-commands and event handlers.

**Persistence**  
Uses Lowdb with JSON file presets (`config.json`, `roles.json`) for lightweight NoSQL storage.

🛠️ Development

- Reload slash-commands on every `node index.js` startup — no manual deploy scripts needed.

- Add new modules by creating `modules/YourFeature.js` exporting:

```js
export const commandData = [ /* SlashCommandBuilder instances */ ];
export function registerModule(client) { /* register listeners */ }
```
