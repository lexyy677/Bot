require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const express = require('express');

// --- Servidor web para mantener el bot activo 24/7 ---
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot activo'));
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));

// --- Configuración del Bot ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`¡Bot encendido como ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('.get')) return;

    const args = message.content.split(' ');
    const url = args[1];

    if (!url) return message.reply('Por favor, ingresa una URL. Ejemplo: `.get https://lexyy67.netlify.app/`');

    try {
        const msg = await message.reply('Obteniendo el HTML...');

        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            timeout: 10000
        });

        const htmlContent = typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : String(response.data);

        // Si es muy largo (>1900 caracteres), enviar como archivo .html
        if (htmlContent.length > 1900) {
            const buffer = Buffer.from(htmlContent, 'utf-8');
            await msg.delete().catch(() => {});
            return message.channel.send({
                content: `El código HTML de **${url}** es extenso. Aquí tienes el archivo:`,
                files: [{ attachment: buffer, name: 'index.html' }]
            });
        }

        // Si es corto, enviar en el chat dentro de un bloque de código
        await msg.edit(`\`\`\`html\n${htmlContent}\n\`\`\``);

    } catch (error) {
        message.reply(`Error al obtener la página: \`${error.message}\``);
    }
});

client.login(process.env.DISCORD_TOKEN);
