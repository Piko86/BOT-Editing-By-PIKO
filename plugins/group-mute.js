const config = require('../config')
const { cmd, commands } = require('../command')
const { isBotAdmin } = require('../lib/isAdmin');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson} = require('../lib/functions')

cmd({
    pattern: "mute",
    alias: ["groupmute"],
    react: "🔇",
    desc: "Mute the group (Only admins can send messages).",
    category: "group",
    filename: __filename
},           
async (conn, mek, m, { from, isGroup, senderNumber, isAdmins, isBotAdmins, reply }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        if (!isAdmins) return reply("❌ Only group admins can use this command.");
        if (!isBotAdmin) return reply("❌ I need to be an admin to mute the group.");

        await conn.groupSettingUpdate(from, "announcement");
        reply("✅ 𝐆ʀᴏᴜ𝐏 𝐇ᴀ𝐒 𝐁ᴇᴇ𝐍 𝐌ᴜᴛᴇ𝐃. 𝐎ɴʟ𝐘 𝐀ᴅᴍɪɴ𝐒 𝐂ᴀ𝐍 𝐒ᴇɴ𝐃 𝐌ᴇꜱꜱᴀɢᴇ𝐒.");
    } catch (e) {
        console.error("Error muting group:", e);
        reply("❌ Failed to mute the group. Please try again.");
    }
});
