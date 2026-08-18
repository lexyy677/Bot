require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const express = require('express');

// Servidor Express para mantener el bot despierto en Railway
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot activo'));
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('.get')) return;

    const args = message.content.split(' ');
    const url = args[1];

    if (!url) return message.reply('Por favor, proporciona un link. Ejemplo: `.get https://google.com`');

    try {
        const msg = await message.reply('Obteniendo HTML...');
        const response = await axios.get(url, { timeout: 10000 }); // 10s de espera máxima
        const html = response.data.toString();

        if (html.length > 1900) {
            const buffer = Buffer.from(html, 'utf-8');
            return message.channel.send({
                content: `El código es muy largo, aquí tienes el archivo:`,
                files: [{ attachment: buffer, name: 'index.html' }]
            });
        }
        
        await msg.edit(`\`\`\`html\n${html.substring(0, 1900)}\n\`\`\``);
    } catch (err) {
        message.reply(`Error al conectar: ${err.message}`);
    }
});

client.login(process.env.DISCORD_TOKEN);
