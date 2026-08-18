require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const express = require('express');

// --- CONFIGURACIÓN DEL SERVIDOR WEB PARA 24/7 ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('¡El bot de Discord está activo y funcionando 24/7!');
});

app.listen(PORT, () => {
    console.log(`Servidor web corriendo en el puerto ${PORT}`);
});
// ------------------------------------------------

// --- CONFIGURACIÓN DEL BOT DE DISCORD ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const PREFIX = '.';

client.once('ready', () => {
    console.log(`¡Bot encendido como ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'get') {
        const url = args[0];

        if (!url) {
            return message.reply('Por favor, ingresa una URL válida. Ejemplo: `.get https://google.com`');
        }

        try {
            const processingMsg = await message.reply('Obteniendo el código HTML...');

            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            let htmlContent = response.data;

            if (typeof htmlContent === 'object') {
                htmlContent = JSON.stringify(htmlContent, null, 2);
            } else {
                htmlContent = String(htmlContent);
            }

            if (htmlContent.length > 1900) {
                const buffer = Buffer.from(htmlContent, 'utf-8');
                await processingMsg.delete().catch(() => {});
                return message.channel.send({
                    content: `El HTML de **${url}** es demasiado extenso para mostrarlo en el chat. Aquí tienes el archivo:`,
                    files: [{ attachment: buffer, name: 'index.html' }]
                });
            }

            await processingMsg.edit(`\`\`\`html\n${htmlContent}\n\`\`\``);

        } catch (error) {
            console.error(error);
            await message.reply(`Hubo un error al obtener la página: \`${error.message}\``);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
