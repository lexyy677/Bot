require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const express = require('express');

// --- 1. Servidor Express (Mantiene el bot 24/7 en Railway) ---
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot de Discord activo 24/7'));
app.listen(PORT, () => console.log(`Servidor web activo en puerto ${PORT}`));

// --- 2. Bot de Discord ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`Bot encendido y conectado: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('.get')) return;

    const args = message.content.split(' ');
    const url = args[1];

    if (!url) return message.reply('Uso: `.get https://tu-link.com`');

    try {
        const statusMsg = await message.reply('Extrayendo código fuente HTML...');
        
        const response = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
            },
            timeout: 15000
        });

        // Convertimos el contenido a texto
        const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2);

        // --- ENVIAR SIEMPRE COMO ARCHIVO ---
        const buffer = Buffer.from(html, 'utf-8');
        
        await message.channel.send({
            content: `Aquí tienes el código fuente de **${url}**:`,
            files: [{ attachment: buffer, name: 'index.html' }]
        });

        // Borramos el mensaje de carga
        await statusMsg.delete().catch(() => {});

    } catch (err) {
        message.reply(`Error al intentar obtener la página: \`${err.message}\``);
    }
});

client.login(process.env.DISCORD_TOKEN);
