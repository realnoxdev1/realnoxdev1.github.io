require("dotenv").config();

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  MessageFlags,
} = require("discord.js");

const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
  console.error("Missing DISCORD_BOT_TOKEN. Add your bot token to bot/.env.");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const sasBlue = 0x0065a8;
const rulesChannelId = "1569900334069846180";
const fleetChannelId = "1571265309183053864";

const aboutCommand = {
  name: "about",
  description: "Learn about our Scandinavian-inspired virtual airline community.",
};

const aboutSasCommand = {
  name: "aboutsas",
  description: "Learn about our Scandinavian-inspired virtual airline community.",
};

function createAboutEmbed() {
  return new EmbedBuilder()
    .setColor(sasBlue)
    .setAuthor({ name: "SCANDINAVIAN AIRLINES • VIRTUAL COMMUNITY" })
    .setTitle("Welcome aboard")
    .setDescription(
      "A Scandinavian-inspired virtual airline community bringing **PTFS** and **Project Flight** pilots together."
    )
    .addFields(
      {
        name: "✈️ Our journey",
        value: "Discover the skies, fly together, and enjoy the spirit of Scandinavian aviation.",
        inline: false,
      },
      {
        name: "🌍 Where we fly",
        value: "Pilot events and community flights in **PTFS** and **Project Flight**.",
        inline: true,
      },
      {
        name: "🤝 Everyone welcome",
        value: "Join in, meet fellow aviation fans, and make every flight count.",
        inline: true,
      }
    )
    .setFooter({
      text: "Independent virtual community • Not affiliated with Scandinavian Airlines",
    });
}

function createMoreAboutEmbed() {
  return new EmbedBuilder()
    .setColor(sasBlue)
    .setTitle("More About Us")
    .setDescription(
      "We’re a community of aviation enthusiasts bringing Scandinavian-inspired flights to life in PTFS and Project Flight."
    )
    .addFields(
      {
        name: "Our community",
        value: "A welcoming place to meet other pilots, share your interest in aviation, and take part in group flying.",
      },
      {
        name: "Our flights",
        value: "We aim for enjoyable, coordinated flights inspired by Scandinavian routes and airline operations.",
      },
      {
        name: "Our identity",
        value: "This is an independent fan-run virtual community and is not affiliated with or endorsed by Scandinavian Airlines.",
      }
    );
}

function createFleetEmbed() {
  return new EmbedBuilder()
    .setColor(sasBlue)
    .setAuthor({ name: "SCANDINAVIAN AIRLINES • VIRTUAL FLEET" })
    .setTitle("Our Fleet")
    .setDescription(
      "*Explore the aircraft our pilots fly in PTFS and Project Flight.*\n\nOur Scandinavian-inspired virtual fleet brings airline-style flying to both simulators."
    )
    .addFields(
      {
        name: "✈️ PTFS Fleet",
        value: [
          "Airbus A320",
          "Airbus A330",
          "Airbus A350",
          "Boeing 737",
        ].join("\n"),
        inline: false,
      },
      {
        name: "🌍 Project Flight Fleet",
        value: [
          "Airbus A320",
          "Airbus A330",
          "Airbus A350",
          "Boeing 737",
        ].join("\n"),
        inline: false,
      }
    )
    .setFooter({
      text: "Independent virtual community • Aircraft availability may vary by game",
    });
}

function createRulesEmbed() {
  return new EmbedBuilder()
    .setColor(sasBlue)
    .setTitle("✈️ Community Flight Rules")
    .setDescription(
      "Help keep our Scandinavian-inspired aviation community welcoming, safe, and fun for everyone."
    )
    .addFields(
      {
        name: "Community Rules",
        value: [
          "**1. Be respectful.** Treat members fairly; harassment, slurs, and bullying are not allowed.",
          "**2. Keep it appropriate.** No NSFW, hateful, or otherwise inappropriate content.",
          "**3. Don’t spam or advertise.** Avoid message flooding, disruptive pings, and unsolicited promotions.",
          "**4. Use the right channels.** Keep conversations relevant and follow each channel’s purpose.",
          "**5. Protect privacy.** Never share personal information or someone’s private messages without consent.",
        ].join("\n"),
      },
      {
        name: "Flight Operations",
        value: [
          "**6. Follow platform rules.** Follow Discord and Roblox terms of service and applicable laws.",
          "**7. Fly fairly.** No exploiting, cheating, or abusing glitches in PTFS or Project Flight.",
          "**8. Follow the flight host.** Respect event instructions, ATC, and reasonable roleplay procedures.",
          "**9. No disruptive flying.** Don’t grief, troll, or intentionally interfere with other pilots.",
          "**10. Respect staff decisions.** Follow moderator directions; raise concerns calmly through the appropriate channel.",
        ].join("\n"),
      }
    )
    .setFooter({
      text: "Independent virtual community • Not affiliated with Scandinavian Airlines",
    });
}

async function publishOrUpdateEmbed(channelId, embedTitle, embed) {
  const channel = await client.channels.fetch(channelId);
  if (!channel?.isTextBased() || !channel.messages) {
    throw new Error(`Channel ${channelId} is not a text channel.`);
  }

  const recentMessages = await channel.messages.fetch({ limit: 100 });
  const existingPost = recentMessages.find(
    (message) =>
      message.author.id === client.user.id &&
      message.embeds.some((messageEmbed) => messageEmbed.title === embedTitle)
  );

  if (existingPost) {
    await existingPost.edit({ embeds: [embed] });
  } else {
    await channel.send({ embeds: [embed] });
  }
}

function createAboutButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("sas:more-about")
      .setLabel("More About Us")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("sas:fleet")
      .setLabel("Our Fleet")
      .setStyle(ButtonStyle.Secondary)
  );
}

client.once(Events.ClientReady, async (readyClient) => {
  try {
    const commands = await readyClient.application.commands.fetch();

    for (const command of [aboutCommand, aboutSasCommand]) {
      const existing = commands.find((registered) => registered.name === command.name);
      if (existing) {
        await readyClient.application.commands.edit(existing.id, command);
      } else {
        await readyClient.application.commands.create(command);
      }
    }

    console.log(`Logged in as ${readyClient.user.tag}; slash commands are registered.`);
  } catch (error) {
    console.error("Could not register slash commands:", error);
    process.exitCode = 1;
    await readyClient.destroy();
    return;
  }

  for (const [channelId, title, embed] of [
    [rulesChannelId, "✈️ Community Flight Rules", createRulesEmbed()],
    [fleetChannelId, "Our Fleet", createFleetEmbed()],
  ]) {
    try {
      await publishOrUpdateEmbed(channelId, title, embed);
      console.log(`"${title}" embed posted or updated in channel ${channelId}.`);
    } catch (error) {
      console.error(`Could not post "${title}" in channel ${channelId}:`, error);
    }
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "about" || interaction.commandName === "aboutsas") {
      await interaction.reply({
        embeds: [createAboutEmbed()],
        components: [createAboutButtons()],
      });
    }
    return;
  }

  if (!interaction.isButton()) return;

  if (interaction.customId === "sas:more-about") {
    await interaction.reply({
      embeds: [createMoreAboutEmbed()],
      flags: MessageFlags.Ephemeral,
    });
  } else if (interaction.customId === "sas:fleet") {
    await interaction.reply({
      embeds: [createFleetEmbed()],
      flags: MessageFlags.Ephemeral,
    });
  }
});

client.login(token).catch((error) => {
  console.error("Could not log in to Discord. Check that DISCORD_BOT_TOKEN is valid:", error);
  process.exitCode = 1;
});
