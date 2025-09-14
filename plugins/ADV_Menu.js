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
}, async (conn, mek, m, { from, reply }) => {
    try {
        // Count total commands
        const totalCommands = Object.keys(commands).length;
        
        const menuCaption = `👋 *HELLO  @${pushname}*
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

*㋛ 𝙿𝙾𝚆𝙴𝚁𝙳 𝙱𝚈 𝙿_𝙸_𝙺_𝙾 〽️*`,


        // Function to send menu image with timeout
        const sendMenuImage = async () => {
            try {
                return await conn.sendMessage(
                    from,
                    {
                        image: { url: config.MAINMENU_IMG },
                        caption: menuCaption,
                        contextInfo: contextInfo
                    },
                    { quoted: mek }
                );
            } catch (e) {
                console.log('Image send failed, falling back to text');
                return await conn.sendMessage(
                    from,
                    { text: menuCaption, contextInfo: contextInfo },
                    { quoted: mek }
                );
            }
        };

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

  const selectedMenu = subMenus[categoryNumber];
  if (selectedMenu) {
    let commandList = "";
    selectedMenu.commands.forEach(cmd => {
      commandList += `*╭──────────●●►*\n*│Command:* ${cmd.name}\n*│Use:* ${cmd.use}\n*╰──────────●●►*\n\n`;
    });
        
        const messageID = sentMsg.key.id;

        // Menu data (complete version)
        const menuData = {
            '1': {
                title: "📥 *Download Menu* 📥",
                content: `👋 *HELLO*
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
            '2': {
                title: "👥 *Group Menu* 👥",
                content: `╭━━━〔 *𝙶𝚁𝙾𝚄𝙿 𝙼𝙴𝙽𝚄* 〕━━━┈⊷
┃★╭──────────────
┃★│ 🛠️ *Management*
┃★│ • grouplink
┃★│ • kickall
┃★│ • kickall2
┃★│ • kickall3
┃★│ • add @user
┃★│ • remove @user
┃★│ • kick @user
┃★╰──────────────
┃★╭──────────────
┃★│ ⚡ *Admin Tools*
┃★│ • promote @user
┃★│ • demote @user
┃★│ • dismiss 
┃★│ • revoke
┃★│ • mute [time]
┃★│ • unmute
┃★│ • lockgc
┃★│ • unlockgc
┃★╰──────────────
┃★╭──────────────
┃★│ 🏷️ *Tagging*
┃★│ • tag @user
┃★│ • hidetag [msg]
┃★│ • tagall
┃★│ • tagadmins
┃★│ • invite
┃★╰──────────────
╰━━━━━━━━━━━━━━━┈⊷
${config.FOOTER}`,
                image: true
            },
            '3': {
                title: "😄 *Fun Menu* 😄",
                content: `╭━━━〔 *𝙵𝚄𝙽 𝙼𝙴𝙽𝚄* 〕━━━┈⊷
┃★╭──────────────
┃★│ 🎭 *Interactive*
┃★│ • shapar
┃★│ • rate @user
┃★│ • insult @user
┃★│ • hack @user
┃★│ • ship @user1 @user2
┃★│ • character
┃★│ • pickup
┃★│ • joke
┃★╰──────────────
┃★╭──────────────
┃★│ 😂 *Reactions*
┃★│ • hrt
┃★│ • hpy
┃★│ • syd
┃★│ • anger
┃★│ • shy
┃★│ • kiss
┃★│ • mon
┃★│ • cunfuzed
┃★╰──────────────
╰━━━━━━━━━━━━━━━┈⊷
${config.FOOTER}`,
                image: true
            },
            '4': {
                title: "👑 *Owner Menu* 👑",
                content: `╭━━━〔 *𝙾𝚆𝙽𝙴𝚁 𝙼𝙴𝙽𝚄* 〕━━━┈⊷
┃★╭──────────────
┃★│ ⚠️ *Restricted*
┃★│ • block @user
┃★│ • unblock @user
┃★│ • fullpp [img]
┃★│ • setpp [img]
┃★│ • restart
┃★│ • shutdown
┃★│ • updatecmd
┃★╰──────────────
┃★╭──────────────
┃★│ ℹ️ *Info Tools*
┃★│ • gjid
┃★│ • jid @user
┃★│ • listcmd
┃★│ • allmenu
┃★╰──────────────
╰━━━━━━━━━━━━━━━┈⊷
${config.FOOTER}`,
                image: true
            },
            '5': {
                title: "🤖 *AI Menu* 🤖",
                content: `╭━━━〔 *𝙰𝙸 𝙼𝙴𝙽𝚄* 〕━━━┈⊷
┃★╭──────────────
┃★│ 💬 *Chat AI*
┃★│ • ai [query]
┃★│ • gpt3 [query]
┃★│ • gpt2 [query]
┃★│ • gptmini [query]
┃★│ • gpt [query]
┃★│ • meta [query]
┃★╰──────────────
┃★╭──────────────
┃★│ 🖼️ *Image AI*
┃★│ • imagine [text]
┃★│ • imagine2 [text]
┃★╰──────────────
┃★╭──────────────
┃★│ 🔍 *Specialized*
┃★│ • blackbox [query]
┃★│ • luma [query]
┃★│ • dj [query]
┃★│ • khan [query]
┃★╰──────────────
╰━━━━━━━━━━━━━━━┈⊷
${config.FOOTER}`,
                image: true
            },
            '6': {
                title: "🎎 *Anime Menu* 🎎",
                content: `╭━━━〔 *𝙰𝙽𝙸𝙼𝙴 𝙼𝙴𝙽𝚄* 〕━━━┈⊷
┃★╭──────────────
┃★│ 🖼️ *Images*
┃★│ • fack
┃★│ • dog
┃★│ • awoo
┃★│ • garl
┃★│ • waifu
┃★│ • neko
┃★│ • megnumin
┃★│ • maid
┃★│ • loli
┃★╰──────────────
┃★╭──────────────
┃★│ 🎭 *Characters*
┃★│ • animegirl
┃★│ • animegirl1-5
┃★│ • anime1-5
┃★│ • foxgirl
┃★│ • naruto
┃★╰──────────────
╰━━━━━━━━━━━━━━━┈⊷
${config.FOOTER}`,
                image: true
            },
            '7': {
                title: "🔄 *Convert Menu* 🔄",
                content: `╭━━━〔 *𝙲𝙾𝙽𝚅𝙴𝚁𝚃 𝙼𝙴𝙽𝚄* 〕━━━┈⊷
┃★╭──────────────
┃★│ 🖼️ *Media*
┃★│ • sticker [img]
┃★│ • sticker2 [img]
┃★│ • emojimix 😎+😂
┃★│ • take [name,text]
┃★│ • tomp3 [video]
┃★╰──────────────
┃★╭──────────────
┃★│ 📝 *Text*
┃★│ • fancy [text]
┃★│ • tts [text]
┃★│ • trt [text]
┃★│ • base64 [text]
┃★│ • unbase64 [text]
┃★╰──────────────
╰━━━━━━━━━━━━━━━┈⊷
${config.FOOTER}`,
                image: true
            },
            '8': {
                title: "📌 *Other Menu* 📌",
                content: `╭━━━〔 *𝙾𝚃𝙷𝙴𝚁 𝙼𝙴𝙽𝚄* 〕━━━┈⊷
┃★╭──────────────
┃★│ 🕒 *Utilities*
┃★│ • timenow
┃★│ • date
┃★│ • count [num]
┃★│ • calculate [expr]
┃★│ • countx
┃★╰──────────────
┃★╭──────────────
┃★│ 🎲 *Random*
┃★│ • flip
┃★│ • coinflip
┃★│ • rcolor
┃★│ • roll
┃★│ • fact
┃★╰──────────────
┃★╭──────────────
┃★│ 🔍 *Search*
┃★│ • define [word]
┃★│ • news [query]
┃★│ • movie [name]
┃★│ • weather [loc]
┃★╰──────────────
╰━━━━━━━━━━━━━━━┈⊷
${config.FOOTER}`,
                image: true
            },
            '9': {
                title: "💞 *Reactions Menu* 💞",
                content: `╭━━━〔 *𝚁𝙴𝙰𝙲𝚃𝙸𝙾𝙽𝚂 𝙼𝙴𝙽𝚄* 〕━━━┈⊷
┃★╭──────────────
┃★│ ❤️ *Affection*
┃★│ • cuddle @user
┃★│ • hug @user
┃★│ • kiss @user
┃★│ • lick @user
┃★│ • pat @user
┃★╰──────────────
┃★╭──────────────
┃★│ 😂 *Funny*
┃★│ • bully @user
┃★│ • bonk @user
┃★│ • yeet @user
┃★│ • slap @user
┃★│ • kill @user
┃★╰──────────────
┃★╭──────────────
┃★│ 😊 *Expressions*
┃★│ • blush @user
┃★│ • smile @user
┃★│ • happy @user
┃★│ • wink @user
┃★│ • poke @user
┃★╰──────────────
╰━━━━━━━━━━━━━━━┈⊷
${config.FOOTER}`,
                image: true
            },
            '10': {
                title: "🏠 *Main Menu* 🏠",
                content: `╭━━━〔 *𝙼𝙰𝙸𝙽 𝙼𝙴𝙽𝚄* 〕━━━┈⊷
┃★╭──────────────
┃★│ ℹ️ *Bot Info*
┃★│ • ping
┃★│ • live
┃★│ • alive
┃★│ • runtime
┃★│ • uptime
┃★│ • repo
┃★│ • owner
┃★╰──────────────
┃★╭──────────────
┃★│ 🛠️ *Controls*
┃★│ • menu
┃★│ • menu2
┃★│ • restart
┃★╰──────────────
╰━━━━━━━━━━━━━━━┈⊷
${config.FOOTER}`,
                image: true
            }
        };

        // Message handler with improved error handling
        const handler = async (msgData) => {
            try {
                const receivedMsg = msgData.messages[0];
                if (!receivedMsg?.message || !receivedMsg.key?.remoteJid) return;

                const isReplyToMenu = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;
                
                if (isReplyToMenu) {
                    const receivedText = receivedMsg.message.conversation || 
                                      receivedMsg.message.extendedTextMessage?.text;
                    const senderID = receivedMsg.key.remoteJid;

                    if (menuData[receivedText]) {
                        const selectedMenu = menuData[receivedText];
                     //fbkjbsafkjhbjsahbfjhbasljbflabgljhbjhbbghrbghbhbhbhbhbhb
                            await conn.sendMessage(senderID, {
                                react: { text: '✅', key: receivedMsg.key }
                            });

                        } catch (e) {
                            console.log('Menu reply error:', e);
                            await conn.sendMessage(
                                senderID,
                                { text: selectedMenu.content, contextInfo: contextInfo },
                                { quoted: receivedMsg }
                            );
                        }

                    } else {
                        await conn.sendMessage(
                            senderID,
                            {
                                text: `❌ *Invalid Option!* ❌\n\nPlease reply with a number between 1-10 to select a menu.\n\n*Example:* Reply with "1" for Download Menu\n\n${config.FOOTER}`,
                                contextInfo: contextInfo
                            },
                            { quoted: receivedMsg }
                        );
                    }
                }
            } catch (e) {
                console.log('Handler error:', e);
            }
        };

        // Add listener
        conn.ev.on("messages.upsert", handler);

        // Remove listener after 5 minutes
        setTimeout(() => {
            conn.ev.off("messages.upsert", handler);
        }, 300000);

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
