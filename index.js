const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder
} = require("discord.js");

const express = require("express");

const app = express();
app.use(express.json());

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

// Minecraft-dan gələn gözləyən kodlar
// Daha sonra bunu API ilə dolduracağıq.
const pendingCodes = new Map();

// Təsdiqlənmiş hesablar
const verified = new Map();

// Discord bot tokenini GitHub-a YAZMA!
// Render-də DISCORD_TOKEN environment variable olacaq.
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// API təhlükəsizlik açarı
const API_KEY = process.env.API_KEY;

if (!TOKEN || !CLIENT_ID || !API_KEY) {
    console.error("❌ DISCORD_TOKEN, CLIENT_ID və API_KEY dəyişənləri yoxdur!");
    process.exit(1);
}

// Slash command
const commands = [
    new SlashCommandBuilder()
        .setName("verify")
        .setDescription("Minecraft hesabını Discord hesabına bağla")
        .addStringOption(option =>
            option
                .setName("kod")
                .setDescription("Minecraft-da /discordserver ilə aldığın 6 rəqəmli kod")
                .setRequired(true)
        )
        .toJSON()
];

const rest = new REST({ version: "10" }).setToken(TOKEN);

async function registerCommands() {
    try {
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands }
        );

        console.log("✅ /verify komandası aktivdir!");
    } catch (error) {
        console.error("❌ Slash command xətası:", error);
    }
}

// Minecraft kod yaratmaq üçün API
app.post("/api/create-code", (req, res) => {
    if (req.headers["x-api-key"] !== API_KEY) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
    }

    const { minecraftUsername, minecraftUuid, code } = req.body;

    if (!minecraftUsername || !minecraftUuid || !code) {
        return res.status(400).json({
            success: false,
            message: "Missing data"
        });
    }

    pendingCodes.set(String(code), {
        minecraftUsername,
        minecraftUuid,
        createdAt: Date.now()
    });

    console.log(
        `🎮 Yeni kod: ${minecraftUsername} → ${code}`
    );

    return res.json({
        success: true
    });
});

// Discord
