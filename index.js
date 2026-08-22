const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  PermissionFlagsBits, 
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  AttachmentBuilder,
  SlashCommandBuilder
} = require('discord.js');
const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

// --- ARCHIVO Y FUNCIONES PARA REGISTRO DE TOP STAFF Y CALIFICACIONES ---
const STATS_FILE = path.join(__dirname, 'ticketStats.json');

function cargarEstadisticas() {
  if (!fs.existsSync(STATS_FILE)) {
    fs.writeFileSync(STATS_FILE, JSON.stringify({}), 'utf-8');
    return {};
  }
  try {
    const data = fs.readFileSync(STATS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error al leer ticketStats.json:', err);
    return {};
  }
}

function guardarEstadisticas(stats) {
  try {
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error al guardar ticketStats.json:', err);
  }
}

function sumarTicketCerrado(userId) {
  const stats = cargarEstadisticas();
  if (!stats[userId]) {
    stats[userId] = { tickets: 0, ratings: [] };
  }
  if (typeof stats[userId] === 'number') {
    stats[userId] = { tickets: stats[userId], ratings: [] };
  }
  stats[userId].tickets += 1;
  guardarEstadisticas(stats);
}

function agregarCalificacion(staffId, rating) {
  const stats = cargarEstadisticas();
  if (!stats[staffId]) {
    stats[staffId] = { tickets: 0, ratings: [] };
  }
  if (typeof stats[staffId] === 'number') {
    stats[staffId] = { tickets: stats[staffId], ratings: [] };
  }
  stats[staffId].ratings.push(rating);
  guardarEstadisticas(stats);
}

// --- CONFIGURACIÓN DE APARIENCIA Y EMOJIS ---
const BOT_AVATAR_URL = "https://cdn.discordapp.com/attachments/1539546821066752080/1540545314682052629/Proyecto_nuevo_17.png?ex=6a8a5820&is=6a8906a0&hm=20c03de87c306c0387da2e6b1e6aa076ad0d0a5f003b9d0e517df2c0a4d2ee77&";

const EMOJI_TICKET_HEADER = '<:emoji_11:1539597339746893975>';
const EMOJI_SOPORTE_TEXT = '<:soporte:1539584375384047636>';
const EMOJI_DUDAS_TEXT = '<:dudas:1539584438063865856>';
const EMOJI_REPORTE_TEXT = '<:reporte:1539584466685796375>';
const EMOJI_TIENDA_TEXT = '<:tienda:1539584484033429536>';
const EMOJI_MEDIA_TEXT = '<:media:1539584515729788950>';
const EMOJI_POSTULACIONES_TEXT = '<:postulaciones:1539584543386763266>';

const EMOJI_SOPORTE_ID = '1539584375384047636';
const EMOJI_DUDAS_ID = '1539584438063865856';
const EMOJI_REPORTE_ID = '1539584466685796375';
const EMOJI_TIENDA_ID = '1539584484033429536';
const EMOJI_MEDIA_ID = '1539584515729788950';
const EMOJI_POSTULACIONES_ID = '1539584543386763266';

const EMOJI_SALUDO = '<:saludo:1539592517677351083>';
const EMOJI_PELIGRO = '<:peligro:1539592609658572850>';
const EMOJI_FIESTA = '<:fiesta:1539590495662112798>';
const EMOJI_BOOST = '<:boost:1539594819796471918>';

const CANAL_EMOJIS = {
  'soporte': '🔧',
  'dudas': '❓',
  'reporte': '🚨',
  'tienda': '🛒',
  'media': '🎥',
  'postulaciones': '📝'
};

const COLOR_SCRAPBOX = '#00FF00';

// --- 1. PREVENCIÓN ANTI-CRASH GLOBAL ---
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ [ANTI-CRASH] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err, origin) => {
  console.error('⚠️ [ANTI-CRASH] Uncaught Exception:', err);
});

// --- 2. SERVIDOR KEEP-ALIVE (24/7) ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.status(200).send('🤖 ScrapBox Bot está activo 24/7.'));
app.listen(PORT, () => console.log(`🌐 Servidor web listo en el puerto ${PORT}`));

setInterval(() => {
  if (process.env.RAILWAY_STATIC_URL) {
    http.get(`http://${process.env.RAILWAY_STATIC_URL}`, () => {}).on('error', () => {});
  }
}, 300000);

// --- 3. INICIALIZACIÓN DEL BOT ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const embedSlashCommand = new SlashCommandBuilder()
  .setName('embed')
  .setDescription('Crea y envía un embed personalizado (Solo Administradores)')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addStringOption(option =>
    option.setName('descripcion')
      .setDescription('Contenido / Descripción dentro del embed (soporta \\n para saltos de línea)')
      .setRequired(false))
  .addStringOption(option =>
    option.setName('titulo')
      .setDescription('Título del embed')
      .setRequired(false))
  .addStringOption(option =>
    option.setName('mensaje')
      .setDescription('Texto normal fuera del embed (p. ej. @everyone, @here o anuncios)')
      .setRequired(false))
  .addStringOption(option =>
    option.setName('color')
      .setDescription('Selecciona un color predeterminado para el embed')
      .setRequired(false)
      .addChoices(
        { name: '🟢 Verde ScrapBox (#00FF00)', value: '#00FF00' },
        { name: '🔴 Rojo (#FF0000)', value: '#FF0000' },
        { name: '🔵 Azul (#0099FF)', value: '#0099FF' },
        { name: '🟡 Amarillo (#FFFF00)', value: '#FFFF00' },
        { name: '🟠 Naranja (#FFA500)', value: '#FFA500' },
        { name: '💖 Rosa (#FF69B4)', value: '#FF69B4' },
        { name: '🏆 Dorado (#FFD700)', value: '#FFD700' },
        { name: '⚫ Negro (#010101)', value: '#010101' },
        { name: '⚪ Blanco (#FFFFFF)', value: '#FFFFFF' }
      ))
  .addAttachmentOption(option =>
    option.setName('imagen')
      .setDescription('Adjunta la foto o banner directamente desde tu dispositivo')
      .setRequired(false));

client.once('ready', async () => {
  console.log(`✅ ${client.user.tag} conectado y listo.`);
  client.user.setActivity('ScrapBox | 24/7 Online', { type: 0 });

  try {
    await client.user.setUsername('ScrapBox Bot');
  } catch (err) {
    console.error('⚠️ No se pudo cambiar el nombre del bot:', err.message);
  }

  try {
    await client.user.setAvatar(BOT_AVATAR_URL);
  } catch (err) {
    console.error('⚠️ No se pudo cambiar el avatar:', err.message);
  }

  try {
    client.guilds.cache.forEach(async (guild) => {
      await guild.commands.set([embedSlashCommand]);
    });
    console.log('✅ Slash Command /embed actualizado.');
  } catch (error) {
    console.error('❌ Error registrando Slash Commands:', error);
  }
});

client.on('guildCreate', async (guild) => {
  try {
    await guild.commands.set([embedSlashCommand]);
  } catch (err) {
    console.error('Error al registrar comandos en nuevo servidor:', err);
  }
});

// --- HELPERS ---
function crearEmbedBienvenida(member) {
  const description = 
    `# - ${EMOJI_SALUDO} \`|\` Bienvenido a ScrapBox (${member})\n` +
    `¡Esperamos que te la pases bien en este servidor y hagas amigos y nos apoyes a este proyecto!\n\n` +
    `# - ${EMOJI_PELIGRO} \`|\` Recuerda:\n` +
    `> Leer las reglas - https://discord.com/channels/1539514228342267914/1539519676038774794\n` +
    `> Socializar - https://discord.com/channels/1539514228342267914/1539546821066752080\n` +
    `> ¡Divertirte!\n\n` +
    `# - ${EMOJI_FIESTA} \`|\` ¡Pasatela bien!`;

  return new EmbedBuilder()
    .setDescription(description)
    .setColor(COLOR_SCRAPBOX)
    .setImage(BOT_AVATAR_URL)
    .setTimestamp();
}

function crearEmbedBoost(member) {
  const description = 
    `# ${EMOJI_BOOST} ¡Nuevo boost en el servidor!\n\n` +
    `Muchas gracias ${member} por boostear el servidor, reclama tus recompensas en <#1539559159635116133>`;

  return new EmbedBuilder()
    .setDescription(description)
    .setColor(COLOR_SCRAPBOX)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setTimestamp();
}

// --- EVENTOS DE USUARIO ---
client.on('guildMemberAdd', async (member) => {
  try {
    const channel = member.guild.channels.cache.get(config.welcomeChannelId);
    if (!channel) return;
    const embed = crearEmbedBienvenida(member);
    await channel.send({ content: `${member}`, embeds: [embed] });
  } catch (error) {
    console.error('Error en bienvenida:', error);
  }
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
  try {
    if (!oldMember.premiumSince && newMember.premiumSince) {
      const channel = newMember.guild.channels.cache.get(config.boostChannelId);
      if (!channel) return;
      const embed = crearEmbedBoost(newMember);
      await channel.send({ content: `${newMember}`, embeds: [embed] });
    }
  } catch (error) {
    console.error('Error en boost:', error);
  }
});

// --- COMANDOS DE MENSAJE ---
client.on('messageCreate', async (message) => {
  try {
    if (message.author.bot || !message.guild) return;

    const args = message.content.trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === `${config.prefix}setup-tickets`) {
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.reply('❌ Solo administradores pueden usar este comando.');
      }

      await message.delete().catch(() => {});

      const ticketDescription = 
        `# - ${EMOJI_TICKET_HEADER} \`|\` Tickets ScrapBox\n\n` +
        `Bienvenido a los tickets de **ScrapBox**\n\n` +
        `Opciones:\n` +
        `• Soporte: ${EMOJI_SOPORTE_TEXT}\n` +
        `• Dudas: ${EMOJI_DUDAS_TEXT}\n` +
        `• Reporte: ${EMOJI_REPORTE_TEXT}\n` +
        `• Tienda: ${EMOJI_TIENDA_TEXT}\n` +
        `• Media: ${EMOJI_MEDIA_TEXT}\n` +
        `• Postulaciones: ${EMOJI_POSTULACIONES_TEXT}\n\n` +
        `# - ${EMOJI_PELIGRO} Recuerda que abrir ticket sin razón conlleva una sancion`;

      const embed = new EmbedBuilder()
        .setDescription(ticketDescription)
        .setColor(COLOR_SCRAPBOX)
        .setImage(BOT_AVATAR_URL);

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_ticket_type')
        .setPlaceholder('Elige la categoría de tu consulta...')
        .addOptions(
          new StringSelectMenuOptionBuilder().setLabel('Soporte').setDescription('Problemas técnicos o errores.').setValue('Soporte').setEmoji(EMOJI_SOPORTE_ID),
          new StringSelectMenuOptionBuilder().setLabel('Dudas').setDescription('Preguntas generales sobre el servidor.').setValue('Dudas').setEmoji(EMOJI_DUDAS_ID),
          new StringSelectMenuOptionBuilder().setLabel('Reporte').setDescription('Reportar jugadores o usuarios.').setValue('Reporte').setEmoji(EMOJI_REPORTE_ID),
          new StringSelectMenuOptionBuilder().setLabel('Tienda').setDescription('Consultas sobre rangos, pagos o compras.').setValue('Tienda').setEmoji(EMOJI_TIENDA_ID),
          new StringSelectMenuOptionBuilder().setLabel('Media').setDescription('Solicitudes de rango Media/Creador de contenido.').setValue('Media').setEmoji(EMOJI_MEDIA_ID),
          new StringSelectMenuOptionBuilder().setLabel('Postulaciones').setDescription('Postulaciones para el equipo de Staff.').setValue('Postulaciones').setEmoji(EMOJI_POSTULACIONES_ID)
        );

      const row = new ActionRowBuilder().addComponents(selectMenu);
      await message.channel.send({ embeds: [embed], components: [row] });
      return;
    }

    if (command === `${config.prefix}topstaff` || command === `${config.prefix}top-staff`) {
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.reply('❌ No tienes permisos para consultar las estadísticas del equipo de staff.');
      }

      const stats = cargarEstadisticas();
      const entries = Object.entries(stats).map(([id, data]) => {
        const ticketCount = typeof data === 'number' ? data : (data.tickets || 0);
        const ratingsArr = (data.ratings || []);
        const avg = ratingsArr.length > 0 
          ? (ratingsArr.reduce((a, b) => a + b, 0) / ratingsArr.length).toFixed(1) 
          : 'N/A';
        return { id, tickets: ticketCount, avg };
      });

      const sortedStaff = entries.sort((a, b) => b.tickets - a.tickets).slice(0, 10);

      if (sortedStaff.length === 0) {
        return message.reply('📌 Todavía no hay tickets registrados.');
      }

      let description = '';
      const medallas = ['🥇', '🥈', '🥉'];

      sortedStaff.forEach((item, index) => {
        const icon = medallas[index] || `**${index + 1}.**`;
        const ratingText = item.avg !== 'N/A' ? ` ⭐ **${item.avg}**` : '';
        description += `${icon} <@${item.id}> \`—\` **${item.tickets}** ticket${item.tickets === 1 ? '' : 's'}${ratingText}\n`;
      });

      const embedTop = new EmbedBuilder()
        .setTitle('🏆 Top Staff - Rendimiento y Atenciones')
        .setDescription(description)
        .setColor(COLOR_SCRAPBOX)
        .setFooter({ text: 'ScrapBox • Panel Administrativo', iconURL: BOT_AVATAR_URL })
        .setTimestamp();

      await message.channel.send({ embeds: [embedTop] });
      return;
    }

    if (command === `${config.prefix}bienvenida`) {
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
      const embed = crearEmbedBienvenida(message.author);
      await message.channel.send({ content: `${message.author}`, embeds: [embed] });
      return;
    }

    if (command === `${config.prefix}boost`) {
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
      const embed = crearEmbedBoost(message.member);
      await message.channel.send({ content: `${message.author}`, embeds: [embed] });
      return;
    }

  } catch (error) {
    console.error('❌ Error en comando:', error);
  }
});

// --- INTERACCIONES ---
client.on('interactionCreate', async (interaction) => {
  try {
    // Slash Command Embed
    if (interaction.isChatInputCommand() && interaction.commandName === 'embed') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ Solo los administradores pueden usar este comando.', ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });

      const titulo = interaction.options.getString('titulo');
      const descripcionRaw = interaction.options.getString('descripcion');
      const mensajeTexto = interaction.options.getString('mensaje');
      const colorInput = interaction.options.getString('color') || COLOR_SCRAPBOX;
      const imagenAttachment = interaction.options.getAttachment('imagen');

      if (!titulo && !descripcionRaw && !imagenAttachment) {
        return interaction.editReply({ content: '❌ Debes incluir al menos un **título**, una **descripción** o adjuntar una **imagen**.' });
      }

      const embed = new EmbedBuilder().setColor(colorInput);
      if (titulo) embed.setTitle(titulo);
      if (descripcionRaw) embed.setDescription(descripcionRaw.replace(/\\n/g, '\n'));
      if (imagenAttachment) embed.setImage(imagenAttachment.url);

      const payload = { embeds: [embed] };
      if (mensajeTexto) payload.content = mensajeTexto.replace(/\\n/g, '\n');

      await interaction.channel.send(payload);
      return interaction.editReply({ content: `✅ Embed enviado con éxito en este canal.` });
    }

    // Formulario de Apertura de Ticket
    if (interaction.isStringSelectMenu() && interaction.customId === 'select_ticket_type') {
      const selectedCategory = interaction.values[0];
      const usernameClean = interaction.user.username.toLowerCase();
      const existingChannel = interaction.guild.channels.cache.find(c => c.name.endsWith(`-${usernameClean}`));

      if (existingChannel) {
        return interaction.reply({ content: `❌ Ya tienes un ticket abierto en ${existingChannel}`, ephemeral: true });
      }

      const modal = new ModalBuilder()
        .setCustomId(`ticket_modal_${selectedCategory}`)
        .setTitle(`Ticket: ${selectedCategory}`);

      const nicknameInput = new TextInputBuilder()
        .setCustomId('ticket_nickname')
        .setLabel('Nickname (In-Game / Discord):')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ej: ScrapPlayer')
        .setRequired(true);

      const reasonInput = new TextInputBuilder()
        .setCustomId('ticket_reason')
        .setLabel('Motivo del ticket:')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Explica detalladamente en qué te podemos ayudar...')
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(nicknameInput),
        new ActionRowBuilder().addComponents(reasonInput)
      );

      await interaction.showModal(modal);
    }

    // Creación de Canal de Ticket
    if (interaction.isModalSubmit() && interaction.customId.startsWith('ticket_modal_')) {
      const category = interaction.customId.replace('ticket_modal_', '');
      const nickname = interaction.fields.getTextInputValue('ticket_nickname');
      const reason = interaction.fields.getTextInputValue('ticket_reason');
      const usernameClean = interaction.user.username.toLowerCase();
      const categoryClean = category.toLowerCase();

      const categoryEmoji = CANAL_EMOJIS[categoryClean] || '📌';
      const channelName = `${categoryEmoji}│${categoryClean}-${usernameClean}`;
      const parentCategoryId = config.categoryIds ? config.categoryIds[category] : null;

      const ticketChannel = await interaction.guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: parentCategoryId || null,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] }
        ]
      });

      const welcomeEmbed = new EmbedBuilder()
        .setTitle(`👋 Bienvenido al Ticket | ${category}`)
        .setDescription(`Hola ${interaction.user}, gracias por contactar al equipo de **ScrapBox**.\n\n` +
                        `📋 **Información del Formulario:**\n` +
                        `• **Categoría:** ${category}\n` +
                        `• **Nickname:** ${nickname}\n` +
                        `• **Motivo:** ${reason}`)
        .setColor(COLOR_SCRAPBOX)
        .setTimestamp();

      const claimButton = new ButtonBuilder().setCustomId('claim_ticket').setLabel('Reclamar Ticket').setEmoji('📌').setStyle(ButtonStyle.Success);
      const closeButton = new ButtonBuilder().setCustomId('request_close_ticket').setLabel('Cerrar Ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(claimButton, closeButton);

      await ticketChannel.send({
        content: `${interaction.user} <@&1539563506268119081>`,
        embeds: [welcomeEmbed],
        components: [row]
      });

      await interaction.reply({ content: `✅ Ticket creado en ${ticketChannel}`, ephemeral: true });
    }

    // Reclamar Ticket
    if (interaction.isButton() && interaction.customId === 'claim_ticket') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return interaction.reply({ content: '❌ Solo el staff puede reclamar este ticket.', ephemeral: true });
      }

      const claimEmbed = new EmbedBuilder()
        .setDescription(`📌 Este ticket ha sido reclamado por ${interaction.user}.`)
        .setColor(COLOR_SCRAPBOX);

      const updatedRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`claimed_by_${interaction.user.id}`).setLabel(`Reclamado por ${interaction.user.username}`).setEmoji('✅').setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId('request_close_ticket').setLabel('Cerrar Ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger)
      );

      await interaction.update({ components: [updatedRow] });
      await interaction.channel.send({ embeds: [claimEmbed] });
    }

    // SOLICITUD DE CIERRE (CONFIRMACIÓN)
    if (interaction.isButton() && interaction.customId === 'request_close_ticket') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages) && 
          !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ Solo un miembro del staff puede cerrar este ticket.', ephemeral: true });
      }

      const confirmEmbed = new EmbedBuilder()
        .setTitle('⚠️ ¿Deseas cerrar este ticket?')
        .setDescription('Al confirmar, se guardará el registro de la conversación, se le enviará la transcripción al usuario y el canal será eliminado.')
        .setColor('#FF9900');

      const confirmRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('confirm_close_ticket').setLabel('Confirmar Cierre').setEmoji('✅').setStyle(ButtonStyle.Danger)
      );

      await interaction.reply({ embeds: [confirmEmbed], components: [confirmRow] });
    }

    // CIERRE DEFINITIVO DE TICKET
    if (interaction.isButton() && interaction.customId === 'confirm_close_ticket') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages) && 
          !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ Solo un miembro del staff puede ejecutar esta acción.', ephemeral: true });
      }

      sumarTicketCerrado(interaction.user.id);

      await interaction.update({ content: '🔒 Generando transcript y cerrando el ticket...', embeds: [], components: [] });

      const channel = interaction.channel;

      const ticketOwnerOverwrite = channel.permissionOverwrites.cache.find(
        p => p.type === 1 && p.id !== client.user.id && p.allow.has(PermissionFlagsBits.ViewChannel)
      );

      let ticketOwner = null;
      if (ticketOwnerOverwrite) {
        ticketOwner = await interaction.guild.members.fetch(ticketOwnerOverwrite.id).catch(() => null);
      }

      let allMessages = [];
      let lastId;

      while (true) {
        const options = { limit: 100 };
        if (lastId) options.before = lastId;

        const messages = await channel.messages.fetch(options);
        allMessages.push(...messages.values());
        if (messages.size < 100) break;
        lastId = messages.last().id;
      }

      allMessages.reverse();

      let transcriptText = `# Transcripción del Ticket: ${channel.name}\n`;
      transcriptText += `**Servidor:** ${interaction.guild.name}\n`;
      transcriptText += `**Fecha de cierre:** ${new Date().toLocaleString()}\n`;
      transcriptText += `**Cerrado por:** ${interaction.user.tag}\n`;
      transcriptText += `--------------------------------------------------\n\n`;

      allMessages.forEach(msg => {
        const time = msg.createdAt.toLocaleString();
        const author = `${msg.author.tag} (${msg.author.id})`;
        const content = msg.content || '[Sin texto / Archivo o Embed]';
        
        transcriptText += `[${time}] ${author}:\n${content}\n`;

        if (msg.attachments.size > 0) {
          msg.attachments.forEach(att => {
            transcriptText += `📎 Adjunto: ${att.url}\n`;
          });
        }
        transcriptText += `\n`;
      });

      const fileBuffer = Buffer.from(transcriptText, 'utf-8');
      const attachment = new AttachmentBuilder(fileBuffer, { name: `transcript-${channel.name}.md` });

      if (ticketOwner) {
        const dmEmbed = new EmbedBuilder()
          .setTitle('📄 Transcripción de tu Ticket')
          .setDescription(`Hola ${ticketOwner.user.username}, tu ticket **${channel.name}** en **${interaction.guild.name}** ha sido cerrado.\n\n` +
                          `Adjunto encontrarás el historial completo de la conversación.\n\n` +
                          `⭐ **¿Cómo fue tu experiencia?**\n` +
                          `Por favor califica la atención recibida por nuestro equipo de Staff seleccionando una opción abajo:`)
          .setColor(COLOR_SCRAPBOX)
          .setTimestamp();

        const ratingMenu = new StringSelectMenuBuilder()
          .setCustomId(`rate_staff_${interaction.user.id}`)
          .setPlaceholder('Califica la atención recibida...')
          .addOptions([
            { label: '5 Estrellas - Excelente', value: '5', emoji: '⭐' },
            { label: '4 Estrellas - Buena', value: '4', emoji: '⭐' },
            { label: '3 Estrellas - Regular', value: '3', emoji: '⭐' },
            { label: '2 Estrellas - Mala', value: '2', emoji: '⭐' },
            { label: '1 Estrella - Muy Mala', value: '1', emoji: '⭐' }
          ]);

        const ratingRow = new ActionRowBuilder().addComponents(ratingMenu);

        await ticketOwner.send({ 
          embeds: [dmEmbed], 
          files: [attachment],
          components: [ratingRow] 
        }).catch(() => {
          console.log(`⚠️ No se pudo enviar el DM a ${ticketOwner.user.tag}.`);
        });
      }

      setTimeout(() => {
        channel.delete().catch(() => {});
      }, 3000);
    }

    // Registrar Calificación desde DM
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('rate_staff_')) {
      const staffId = interaction.customId.replace('rate_staff_', '');
      const ratingVal = parseInt(interaction.values[0]);

      agregarCalificacion(staffId, ratingVal);

      const thanksEmbed = new EmbedBuilder()
        .setDescription(`✨ ¡Gracias por tu calificación de **${ratingVal}⭐**! Nos ayuda a mejorar el servicio.`)
        .setColor(COLOR_SCRAPBOX);

      await interaction.update({ 
        embeds: [thanksEmbed], 
        components: [] 
      });
    }

  } catch (error) {
    console.error('Error en interacción:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Hubo un error al procesar esta acción.', ephemeral: true }).catch(() => {});
    }
  }
});

client.login(process.env.DISCORD_TOKEN).catch((err) => {
  console.error('❌ Error al conectar con Discord:', err);
});
