const fs = require('fs');
const config = require('../config');
const { cmd, commands } = require('../command');
const { runtime } = require('../lib/functions');
const axios = require('axios');

cmd({
    pattern: "menu",
    desc: "Show interactive menu system",
    category: "menu",
    react: "🧾",
    filename: __filename
}, async (robin, mek, m, { from, senderNumber, pushname, reply }) => {
    try {
      let uptime = (process.uptime() / 60).toFixed(2);
      let used = process.memoryUsage().heapUsed / 1024 / 1024;
      let totalRam = Math.round(require('os').totalmem / 1024 / 1024);
      let ramUsage = `${Math.round(used * 100) / 100}MB / ${totalRam}MB`;

      // Convert uptime to hours, minutes, seconds
      let uptimeSeconds = Math.floor(process.uptime());
      let hours = Math.floor(uptimeSeconds / 3600);
      let minutes = Math.floor((uptimeSeconds % 3600) / 60);
      let seconds = uptimeSeconds % 60;
      let formattedUptime = hours > 0 ? `${hours} hours, ${minutes} minutes, ${seconds} seconds` : `${minutes} minutes, ${seconds} seconds`;

      let madeMenu = `👋 *HELLO  @${pushname}*
*╭─「 ᴄᴏᴍᴍᴀɴᴅꜱ ᴘᴀɴᴇʟ」*
*│◈ 𝚁𝙰𝙼 𝚄𝚂𝙰𝙶𝙴 -* ${ramUsage}
*│◈ 𝚁𝚄𝙽𝚃𝙸𝙼𝙴 -* ${formattedUptime}
*╰──────────●●►*

*╭──────────●●►*
*│⛵ LIST MENU*
*│   ───────*
*│ 1   OWNER*
*│ 2   MAIN*
*│ 3   DOWNLOAD*
*│ 4   SEARCH*
*│ 5   AI*
*│ 6   CONVERT*
*│ 7   FUN*
*│ 8   GROUP*
*│ 9   ANEMI*
*│ 10   OTHER*
*╰───────────●●►*

*🌟 Reply the Number you want to select*

*㋛ 𝙿𝙾𝚆𝙴𝚁𝙳 𝙱𝚈 𝙿_𝙸_𝙺_𝙾 〽️*`;

      const menuMessage = await robin.sendMessage(
        from,
        {
          image: { url: config.MAINMENU_IMG },
          caption: madeMenu,
          contextInfo: {
            mentionedJid: [`${senderNumber}@s.whatsapp.net`]
          }
        },
        { quoted: mek }
      );



        // Send image with timeout
        let sentMsg;
        try {
            sentMsg = await Promise.race([
                sendMenuImage(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Image send timeout')), 10000))
            ]);
        } catch (e) {
            console.log('Menu send error:', e);
            sentMsg = await conn.sendMessage(
                from,
                { text: menuCaption, contextInfo: contextInfo },
                { quoted: mek }
            );
        }
        
        const messageID = sentMsg.key.id;

        // Menu data (complete version)
        const subMenus = {
            1: {
      title: "OWNER",
      image: "https://raw.githubusercontent.com/Manmitha96/BOT-PHOTOS/refs/heads/main/BotMenuPhoto/Owner.png",
      commands: [
        { name: "restart", use: ".restart" },
        { name: "block", use: ".block <reply to user>" },
        { name: "left", use: ".left" },
        { name: "join", use: ".join <grouplink>" },
        { name: "update", use: ".update" }
      ]
    },
    2: {
      title: "MAIN",
      image: "https://raw.githubusercontent.com/Manmitha96/BOT-PHOTOS/refs/heads/main/BotMenuPhoto/Main.png",
      commands: [
        { name: "alive", use: ".alive" },
        { name: "menu", use: ".menu" },
        { name: "ping", use: ".ping" },
        { name: "system", use: ".system" },
        { name: "vv", use: ".vv <reply to view once>" },
        { name: "dp", use: ".dp < number or reply >" }
      ]
    },
    3: {
      title: "DOWNLOAD",
      image: "https://raw.githubusercontent.com/Manmitha96/BOT-PHOTOS/refs/heads/main/BotMenuPhoto/Download.png",
      commands: [
        { name: "song", use: ".song < Text or Link >" },
        { name: "video", use: ".video < Text or Link >" },
        { name: "fb", use: ".fb < Link >" },
        { name: "tiktok", use: ".tiktok < Link >" },
        { name: "igpost", use: ".igpost < Link >" },
        { name: "igvideo", use: ".igvideo < Link >" },
        { name: "ytshort", use: ".ytshort < Link >" },
        { name: "movie", use: ".movie < Movie Name >" }
      ]
    },
    4: {
      title: "SEARCH",
      image: "https://raw.githubusercontent.com/Manmitha96/BOT-PHOTOS/refs/heads/main/BotMenuPhoto/Search.png",
      commands: [
        { name: "githubstalk", use: ".githubstalk < username >" },
        { name: "Coming soon..", use: ".Coming soon.." }
      ]
    },
    5: {
      title: "AI",
      image: "https://raw.githubusercontent.com/Manmitha96/BOT-PHOTOS/refs/heads/main/BotMenuPhoto/Al.png",
      commands: [
        { name: "ai", use: ".ai < text >" },
        { name: "gemini", use: ".gemini < text >" }
      ]
    },
    6: {
      title: "CONVERT",
      image: "https://raw.githubusercontent.com/Manmitha96/BOT-PHOTOS/refs/heads/main/BotMenuPhoto/Convert.png",
      commands: [
        { name: "tosticker", use: ".tosticker <reply to image>" },
        { name: "toimg", use: ".toimg <reply to sticker>" },
        { name: "vv", use: ".vv <reply to view once>" }
      ]
    },
    7: {
      title: "FUN",
      image: "https://raw.githubusercontent.com/Manmitha96/BOT-PHOTOS/refs/heads/main/BotMenuPhoto/Fun.png",
      commands: [
        { name: "hack", use: ".hack" },
        { name: "animegirl", use: ".animegirl" },
        { name: "fact", use: ".fact" },
        { name: "joke", use: ".joke" },
        { name: "dog", use: ".dog" }
      ]
    },
    8: {
      title: "GROUP",
      image: "https://raw.githubusercontent.com/Manmitha96/BOT-PHOTOS/refs/heads/main/BotMenuPhoto/Group.png",
      commands: [
        { name: "tagall", use: ".tagall [for tag all members]" },
        { name: "hidetag", use: ".hidetag [hide tag members]" },
        { name: "getgpp", use: ".getgpp <for get dp in group>" },
        { name: "kick", use: ".kick <reply to user>" },
        { name: "add", use: ".add < number >" },
        { name: "promote", use: ".promote <reply to user>" },
        { name: "demote", use: ".demote <reply to user>" },
        { name: "mute", use: ".mute" },
        { name: "unmute", use: ".unmute" },
        { name: "dp", use: ".dp < number or reply >" },
        { name: "vv", use: ".vv <reply to view once>" },
        { name: "setname", use: ".setname <new name of group>" },
        { name: "setdesc", use: ".setdesc <new description of group>" },
        { name: "invite", use: ".invite <for get group link>" },
        { name: "removegpp", use: ".removegpp <remove group dp>" },
        { name: "setgrouppic", use: ".setgrouppic <swipe reply to photo>" },
        { name: "testgpp", use: ".testgpp <test cmd>" },
        { name: "quickgpp", use: ".quickgpp <quick set group photo>" },
        { name: "left", use: ".left <if you want left>" }
      ]
    },
    9: {
      title: "ANEMI",
      image: "https://raw.githubusercontent.com/Manmitha96/BOT-PHOTOS/refs/heads/main/BotMenuPhoto/Anemi.png",
      commands: [
        { name: "loli", use: ".loli" },
        { name: "waifu", use: ".waifu" },
        { name: "neko", use: ".neko" },
        { name: "megumin", use: ".megumin" },
        { name: "maid", use: ".maid" },
        { name: "awoo", use: ".awoo" }
      ]
    },
    10: {
      title: "OTHER",
      image: "https://raw.githubusercontent.com/Manmitha96/BOT-PHOTOS/refs/heads/main/BotMenuPhoto/Other.png",
      commands: [
        
        { name: "gpass", use: ".gpass < number >" },
        { name: "githubstalk", use: ".githubstalk < username >" },
        { name: "sh", use: ".sh" }
      ]
    }
  };

        // Message handler with improved error handling
        const selectedMenu = subMenus[categoryNumber];
        const handler = async (msgData) => {
            try {
                const receivedMsg = msgData.messages[0];
                if (!receivedMsg?.message || !receivedMsg.key?.remoteJid) return;

                const isReplyToMenu = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;
                
                if (selectedMenu) {
    let commandList = "";
    selectedMenu.commands.forEach(cmd => {
      commandList += `*╭──────────●●►*\n*│Command:* ${cmd.name}\n*│Use:* ${cmd.use}\n*╰──────────●●►*\n\n`;
    });

    const menuText = `👋 *HELLO*
*╭─「 ᴄᴏᴍᴍᴀɴᴅꜱ ᴘᴀɴᴇʟ」*
*│◈ 𝚁𝙰𝙼 𝚄𝚂𝙰𝙶𝙴 -* ${ramUsage}
*│◈ 𝚁𝚄𝙽𝚃𝙸𝙼𝙴 -* ${formattedUptime}
*╰──────────●●►*

*╭──────────●●►*
*│⚜️ ${selectedMenu.title} Command List:*
*╰──────────●●►*

${commandList}➠ *Total Commands in ${selectedMenu.title}*: ${selectedMenu.commands.length}

*Reply with another number (1-10) for more categories!*

*㋛ 𝙿𝙾𝚆𝙴𝚁𝙳 𝙱𝚈 𝙿_𝙸_𝙺_𝙾 〽️*`;

    const submenuMessage = await robin.sendMessage(
      from,
      {
        image: { url: selectedMenu.image },
        caption: menuText,
        contextInfo: {
          mentionedJid: [`${senderNumber}@s.whatsapp.net`]
        }
      },
      { quoted: mek }
    );

    return submenuMessage; // Return message info for tracking
  }
}

    } catch (e) {
        console.error('Menu Error:', e);
        try {
            await conn.sendMessage(
                from,
                { text: `❌ Menu system is currently busy. Please try again later.\n\n ${config.FOOTER}` },
                { quoted: mek }
            );
        } catch (finalError) {
            console.log('Final error handling failed:', finalError);
        }
    }
});
