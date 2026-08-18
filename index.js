require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const express = require('express');

// Servidor para mantener el bot activo 24/7 en Railway
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot activo 24/7'));
app.listen(PORT);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => console.log(`Bot encendido: ${client.user.tag}`));

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('.get')) return;

    const args = message.content.split(' ');
    const url = args[1];

    if (!url) return message.reply('Uso: `.get https://tu-link.com`');

    try {
        const statusMsg = await message.reply('Obteniendo código fuente...');
        
        const response = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
            },
            timeout: 15000
        });

        const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2);

        // --- ENVIAR SIEMPRE COMO .TXT ---
        const buffer = Buffer.from(html, 'utf-8');
        
        await message.channel.send({
            content: `Código fuente de **${url}**:`,
            files: [{ attachment: buffer, name: 'source.txt' }]
        });

        await statusMsg.delete().catch(() => {});

    } catch (err) {
        message.reply(`Error: \`${err.message}\``);
    }
});

client.login(process.env.DISCORD_TOKEN);
