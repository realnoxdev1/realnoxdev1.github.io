# Scandinavian Virtual Airline Bot

A standalone Discord bot for a Scandinavian-inspired virtual airline community. It adds `/about` and `/aboutsas` commands with a branded embed and **More About Us** / **Our Fleet** buttons. Button details are shown privately to the person who clicked. When the bot starts, it posts or updates a ten-rule embed in channel `1569900334069846180` and a PTFS / Project Flight fleet embed in channel `1571265309183053864`.

This is an independent fan community, not an official Scandinavian Airlines service. The bot does not change or add anything to either website.

## Run locally

Requires Node.js 20 or newer.

1. In this folder, install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `DISCORD_BOT_TOKEN` to your Discord bot token. No other environment values are needed.
3. In the Discord Developer Portal, enable the bot and invite it to your server with the `bot` and `applications.commands` scopes. Give it permission to view both channels, read their message history, send messages, and embed links.
4. Run `npm start`.

The bot registers its slash commands when it starts. Global command updates can take a little time to appear in Discord.

## Keep it online

The bot runs for as long as its Node.js process is running. For continuous availability, run it on an always-on host that supports persistent Node.js processes and configure that host to restart the process if it exits. Availability depends on the host; a local computer that sleeps or shuts down cannot keep the bot online.

Keep `.env` private and never share or commit your bot token. If the token is exposed, reset it in the Discord Developer Portal.
