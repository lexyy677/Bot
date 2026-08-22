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
const mongoose = require('mongoose');

// --- VARIABLES Y CONFIGURACIÓN ---
const PREFIX = process.env.PREFIX || '!';
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID || '1539519676038774794';
const BOOST_CHANNEL_ID = process.env.BOOST_CHANNEL_ID || '1539559159635116133';
const MONGO_URI = process.env.MONGODB_URI || "mongodb+srv://lexyy677_db_user:xwa6dXKqI8icJRGC@cluster0.m1dzdca.mongodb.net/?retryWrites=true&w=majority";[cite: 1]

// --- PREVENCIÓN ANTI-CRASH (EVITA QUE EL BOT SE APAGUE POR ERRORES) ---
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ [ANTI-CRASH] Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('⚠️ [ANTI-CRASH] Uncaught Exception:', err);
});

// --- SERVIDOR WEB KEEP-ALIVE ---
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.status(200).send('🤖 ScrapBox Bot está activo 24/7.'));
app.listen(PORT, () => console.log(`🌐 Servidor web escuchando en el puerto ${PORT}`));

setInterval(() => {
  if (process.env.RAILWAY_STATIC_URL) {
    http.get(`http://${process.env.RAILWAY_STATIC_URL}`, () => {}).on('error', () => {});
  }
}, 300000);

// --- BASE DE DATOS MONGODB ---
mongoose.connect(MONGO_URI)
  .then(() => console.log('🍃 Conectado a MongoDB Atlas con éxito.'))
  .catch(err => console.error('❌ Error al conectar a MongoDB:', err));

const staffSchema = new mongoose.Schema({
  staffId: { type: String, required: true, unique: true },
  tickets: { type: Number, default: 0 },
  ratings: { type: [Number], default: [] }
});
const StaffModel = mongoose.model('StaffStat', staffSchema);

async function sumarTicketCerradoBD(staffId) {
  try {
    await StaffModel.findOneAndUpdate({ staffId }, { $inc: { tickets: 1 } }, { upsert: true, new: true });
  } catch (err) {
    console.error('Error BD sumar ticket:', err);
  }
}

async function agregarCalificacionBD(staffId, rating) {
  try {
    await StaffModel.findOneAndUpdate({ staffId }, { $push: { ratings: rating } }, { upsert: true, new: true });
  } catch (err) {
    console.error('Error BD guardar calificación:', err);
  }
}

// --- CONSTANTES DE APARIENCIA ---
const BOT_AVATAR_URL = "https://cdn.discordapp.com/attachments/1539546821066752080/1540545314682052629/Proyecto_nuevo_17.png?ex=6a8a5820&is=6a8906a0&hm=20c03de87c306c0387da2e6b1e6aa076ad0d0a5f003b9d0e517df2c0a4d2ee77&";
const COLOR_SCRAPBOX = '#00FF00';

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

// --- INICIALIZACIÓN DEL CLIENTE DISCORD ---
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
  .addStringOption(opt => opt.setName('descripcion').setDescription('Contenido del embed').setRequired(false))
  .addStringOption(opt => opt.setName('titulo').setDescription('Título del embed').setRequired(false))
  .addStringOption(opt => opt.setName('mensaje').setDescription('Texto fuera del embed').setRequired(false))
  .addStringOption(opt => opt.setName('color').setDescription('Color').setRequired(false))
  .addAttachmentOption(opt => opt.setName('imagen').setDescription('Foto o banner').setRequired(false));

client.once('ready', async () => {
  console.log(`✅ ${client.user.tag} conectado y listo para trabajar.`);
  client.user.setActivity('ScrapBox | 24/7 Online', { type: 0 });

  try {
    client.guilds.cache.forEach(async (guild) => {
      await guild.commands.set([embedSlashCommand]).catch(() => {});
    });
  } catch (error) {
    console.error('Error registrando comandos Slash:', error);
  }
});

// --- BIENVENIDAS Y BOOSTS ---
client.on('guildMemberAdd', async (member) => {
  try {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel) return;

    const description = 
      `# - ${EMOJI_SALUDO} \`|\` Bienvenido a ScrapBox (${member})\n` +
      `¡Esperamos que te la pases bien en este servidor y hagas amigos y nos apoyes a este proyecto!\n\n` +
      `# - ${EMOJI_PELIGRO} \`|\` Recuerda:\n` +
      `> Leer las reglas - https://discord.com/channels/1539514228342267914/1539519676038774794\n` +
      `> Socializar - https://discord.com/channels/1539514228342267914/1539546821066752080\n` +
      `> ¡Divertirte!\n\n` +
      `# - ${EMOJI_FIESTA} \`|\` ¡Pasatela bien!`;

    const embed = new EmbedBuilder().setDescription(description).setColor(COLOR_SCRAPBOX).setImage(BOT_AVATAR_URL).setTimestamp();
    await channel.send({ content: `${member}`, embeds: [embed] });
  } catch (e) {
    console.error('Error en evento bienvenida:', e);
  }
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
  try {
    if (!oldMember.premiumSince && newMember.premiumSince) {
      const channel = newMember.guild.channels.cache.get(BOOST_CHANNEL_ID);
      if (!channel) return;

      const description = 
        `# ${EMOJI_BOOST} ¡Nuevo boost en el servidor!\n\n` +
        `Muchas gracias ${newMember} por boostear el servidor, reclama tus recompensas en <#1539559159635116133>`;

      const embed = new EmbedBuilder().setDescription(description).setColor(COLOR_SCRAPBOX).setThumbnail(newMember.user.displayAvatarURL({ dynamic: true })).setTimestamp();
      await channel.send({ content: `${newMember}`, embeds: [embed] });
    }
  } catch (e) {
    console.error('Error en evento boost:', e);
  }
});

// --- COMANDOS POR PREFIJO ---
client.on('messageCreate', async (message) => {
  try {
    if (message.author.bot || !message.guild) return;

    const args = message.content.trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // COMANDO !setup-tickets
    if (command === `${PREFIX}setup-tickets`) {
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.reply('❌ Necesitas permisos de Administrador para usar este comando.');
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

      const embed = new EmbedBuilder().setDescription(ticketDescription).setColor(COLOR_SCRAPBOX).setImage(BOT_AVATAR_URL);

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_ticket_type')
        .setPlaceholder('Elige la categoría de tu consulta...')
        .addOptions(
          new StringSelectMenuOptionBuilder().setLabel('Soporte').setValue('Soporte').setEmoji(EMOJI_SOPORTE_ID),
          new StringSelectMenuOptionBuilder().setLabel('Dudas').setValue('Dudas').setEmoji(EMOJI_DUDAS_ID),
          new StringSelectMenuOptionBuilder().setLabel('Reporte').setValue('Reporte').setEmoji(EMOJI_REPORTE_ID),
          new StringSelectMenuOptionBuilder().setLabel('Tienda').setValue('Tienda').setEmoji(EMOJI_TIENDA_ID),
          new StringSelectMenuOptionBuilder().setLabel('Media').setValue('Media').setEmoji(EMOJI_MEDIA_ID),
          new StringSelectMenuOptionBuilder().setLabel('Postulaciones').setValue('Postulaciones').setEmoji(EMOJI_POSTULACIONES_ID)
        );

      const row = new ActionRowBuilder().addComponents(selectMenu);
      await message.channel.send({ embeds: [embed], components: [row] });
      return;
    }

    // COMANDO !topstaff
    if (command === `${PREFIX}topstaff` || command === `${PREFIX}top-staff`) {
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.reply('❌ Necesitas permisos de Administrador.');
      }

      const allStats = await StaffModel.find().lean().catch(() => []);

      if (!allStats || allStats.length === 0) {
        return message.reply('📌 Todavía no hay tickets ni calificaciones registradas en la base de datos.');
      }

      const entries = allStats.map(item => {
        const ticketCount = item.tickets || 0;
        const ratingsArr = item.ratings || [];
        const avg = ratingsArr.length > 0 ? (ratingsArr.reduce((a, b) => a + b, 0) / ratingsArr.length).toFixed(1) : 'N/A';
        return { id: item.staffId, tickets: ticketCount, avg };
      });

      const sortedStaff = entries.sort((a, b) => b.tickets - a.tickets).slice(0, 10);

      let description = '';
      const medallas = ['🥇', '🥈', '🥉'];

      sortedStaff.forEach((item, index) => {
        const icon = medallas[index] || `**${index + 1}.**`;
        const ratingText = item.avg !== 'N/A' ? ` ⭐ **${item.avg}**` : '';
        description += `${icon} <@${item.id}> \`—\` **${item.tickets}** ticket${item.tickets === 1 ? '' : 's'}${ratingText}\n`;
      });

      const embedTop = new EmbedBuilder()
        .setTitle('🏆 Top Staff - Rendimiento Persistente')
        .setDescription(description)
        .setColor(COLOR_SCRAPBOX)
        .setFooter({ text: 'ScrapBox • Datos guardados en la nube', iconURL: BOT_AVATAR_URL })
        .setTimestamp();

      await message.channel.send({ embeds: [embedTop] });
      return;
    }

  } catch (error) {
    console.error('Error en mensaje:', error);
  }
});

// --- MANEJO DE INTERACCIONES Y BOTONES ---
client.on('interactionCreate', async (interaction) => {
  try {
    // SLASH COMMAND /EMBED
    if (interaction.isChatInputCommand() && interaction.commandName === 'embed') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ Solo administradores.', ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });

      const titulo = interaction.options.getString('titulo');
      const descripcionRaw = interaction.options.getString('descripcion');
      const mensajeTexto = interaction.options.getString('mensaje');
      const colorInput = interaction.options.getString('color') || COLOR_SCRAPBOX;
      const imagenAttachment = interaction.options.getAttachment('imagen');

      const embed = new EmbedBuilder().setColor(colorInput);
      if (titulo) embed.setTitle(titulo);
      if (descripcionRaw) embed.setDescription(descripcionRaw.replace(/\\n/g, '\n'));
      if (imagenAttachment) embed.setImage(imagenAttachment.url);

      const payload = { embeds: [embed] };
      if (mensajeTexto) payload.content = mensajeTexto.replace(/\\n/g, '\n');

      await interaction.channel.send(payload);
      return interaction.editReply({ content: `✅ Embed enviado con éxito.` });
    }

    // MENÚ DE SELECCIÓN DE TICKET
    if (interaction.isStringSelectMenu() && interaction.customId === 'select_ticket_type') {
      const selectedCategory = interaction.values[0];
      const usernameClean = interaction.user.username.toLowerCase();

      const existingChannel = interaction.guild.channels.cache.find(c => c.name.endsWith(`-${usernameClean}`));
      if (existingChannel) {
        return interaction.reply({ content: `❌ Ya tienes un ticket abierto en ${existingChannel}`, ephemeral: true });
      }

      const modal = new ModalBuilder().setCustomId(`ticket_modal_${selectedCategory}`).setTitle(`Ticket: ${selectedCategory}`);
      const nicknameInput = new TextInputBuilder().setCustomId('ticket_nickname').setLabel('Nickname:').setStyle(TextInputStyle.Short).setRequired(true);
      const reasonInput = new TextInputBuilder().setCustomId('ticket_reason').setLabel('Motivo:').setStyle(TextInputStyle.Paragraph).setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(nicknameInput), new ActionRowBuilder().addComponents(reasonInput));
      await interaction.showModal(modal);
      return;
    }

    // SUBMIT DEL FORMULARIO DE TICKET
    if (interaction.isModalSubmit() && interaction.customId.startsWith('ticket_modal_')) {
      const category = interaction.customId.replace('ticket_modal_', '');
      const nickname = interaction.fields.getTextInputValue('ticket_nickname');
      const reason = interaction.fields.getTextInputValue('ticket_reason');
      const usernameClean = interaction.user.username.toLowerCase();

      const categoryClean = category.toLowerCase();
      const categoryEmoji = CANAL_EMOJIS[categoryClean] || '📌';
      const channelName = `${categoryEmoji}│${categoryClean}-${usernameClean}`;

      const ticketChannel = await interaction.guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] }
        ]
      });

      const welcomeEmbed = new EmbedBuilder()
        .setTitle(`👋 Bienvenido al Ticket | ${category}`)
        .setDescription(`Hola ${interaction.user}, gracias por contactar a **ScrapBox**.\n\n` +
                        `📋 **Formulario:**\n` +
                        `• **Categoría:** ${category}\n` +
                        `• **Nickname:** ${nickname}\n` +
                        `• **Motivo:** ${reason}`)
        .setColor(COLOR_SCRAPBOX)
        .setTimestamp();

      const claimButton = new ButtonBuilder().setCustomId('claim_ticket').setLabel('Reclamar Ticket').setEmoji('📌').setStyle(ButtonStyle.Success);
      const closeButton = new ButtonBuilder().setCustomId('close_ticket').setLabel('Cerrar Ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(claimButton, closeButton);

      await ticketChannel.send({ content: `${interaction.user} <@&1539563506268119081>`, embeds: [welcomeEmbed], components: [row] });
      await interaction.reply({ content: `✅ Ticket creado en ${ticketChannel}`, ephemeral: true });
      return;
    }

    // RECLAMAR TICKET
    if (interaction.isButton() && interaction.customId === 'claim_ticket') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return interaction.reply({ content: '❌ Solo el staff puede reclamar este ticket.', ephemeral: true });
      }

      const claimEmbed = new EmbedBuilder().setDescription(`📌 Este ticket ha sido reclamado por ${interaction.user}.`).setColor(COLOR_SCRAPBOX);

      const updatedRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`claimed_by_${interaction.user.id}`).setLabel(`Reclamado por ${interaction.user.username}`).setEmoji('✅').setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId('close_ticket').setLabel('Cerrar Ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger)
      );

      await interaction.update({ components: [updatedRow] });
      await interaction.channel.send({ embeds: [claimEmbed] });
      return;
    }

    // CERRAR TICKET
    if (interaction.isButton() && interaction.customId === 'close_ticket') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages) && 
          !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ Solo un miembro del staff puede cerrar este ticket.', ephemeral: true });
      }

      // Guardar ticket cerrado en MongoDB en segundo plano
      sumarTicketCerradoBD(interaction.user.id);

      await interaction.reply('🔒 Generando transcript y cerrando el ticket...');

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
          msg.attachments.forEach(att => transcriptText += `📎 Adjunto: ${att.url}\n`);
        }
        transcriptText += `\n`;
      });

      const fileBuffer = Buffer.from(transcriptText, 'utf-8');
      const attachment = new AttachmentBuilder(fileBuffer, { name: `transcript-${channel.name}.md` });

      if (ticketOwner) {
        const dmEmbed = new EmbedBuilder()
          .setTitle('📄 Transcripción de tu Ticket')
          .setDescription(`Hola ${ticketOwner.user.username}, tu ticket **${channel.name}** en **${interaction.guild.name}** ha sido cerrado.\n\n` +
                          `Adjunto encontrarás el historial de la conversación.\n\n` +
                          `⭐ **¿Cómo fue tu experiencia?**\n` +
                          `Califica la atención brindada por el equipo de Staff seleccionando una opción abajo:`)
          .setColor(COLOR_SCRAPBOX)
          .setTimestamp();

        const ratingMenu = new StringSelectMenuBuilder()
          .setCustomId(`rate_staff_${interaction.user.id}`)
          .setPlaceholder('Califica la atención del Staff...')
          .addOptions([
            { label: '5 Estrellas - Excelente', value: '5', emoji: '⭐' },
            { label: '4 Estrellas - Buena', value: '4', emoji: '⭐' },
            { label: '3 Estrellas - Regular', value: '3', emoji: '⭐' },
            { label: '2 Estrellas - Mala', value: '2', emoji: '⭐' },
            { label: '1 Estrella - Muy Mala', value: '1', emoji: '⭐' }
          ]);

        const ratingRow = new ActionRowBuilder().addComponents(ratingMenu);

        await ticketOwner.send({ embeds: [dmEmbed], files: [attachment], components: [ratingRow] }).catch(() => {});
      }

      setTimeout(() => {
        channel.delete().catch(() => {});
      }, 3000);
      return;
    }

    // CALIFICACIÓN DEL STAFF
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('rate_staff_')) {
      const staffId = interaction.customId.replace('rate_staff_', '');
      const ratingVal = parseInt(interaction.values[0]);

      agregarCalificacionBD(staffId, ratingVal);

      const thanksEmbed = new EmbedBuilder()
        .setDescription(`✨ ¡Gracias por tu calificación de **${ratingVal}⭐**! Se ha registrado correctamente.`)
        .setColor(COLOR_SCRAPBOX);

      await interaction.update({ embeds: [thanksEmbed], components: [] });
      return;
    }

  } catch (error) {
    console.error('Error en interacción:', error);
  }
});

// LOGIN
client.login(process.env.DISCORD_TOKEN);
