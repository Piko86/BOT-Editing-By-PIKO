const { cmd } = require('../command');
const axios = require("axios");

const GEMINI_API_KEY = 'AIzaSyBdBivCo6jWSchTb8meP7VyxbHpoNY_qfQ';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

cmd({
    pattern: "gemini",
    react: "🤖",
    desc: "Talk with Nova-x Mini AI (Gemini)",
    category: "AI",
    use: ".gemini <your message>",
    filename: __filename
}, 
async (conn, mek, m, { reply, args }) => {
    try {
        // ✅ Get query
        const q = args.join(" ") || 
                  m.mtype === "imageMessage" && m.message.imageMessage.caption || 
                  m.mtype === "videoMessage" && m.message.videoMessage.caption || "";

        if (!q || q.trim() === '') {
            return reply("ඕ කියන්න අනේ් මම 𝙺𝙸𝙽𝙶-𝚂𝙰𝙽𝙳𝙴𝚂𝙷-𝙼𝙳 𝙰𝙸🤭");
        }

        // ✅ Custom Gemini prompt
        const prompt = `ඔබ සැබෑ ගැහැනු ලමයෙකු මෙන් හැසිරිය යුතුය. ඉමෝජි පමනක් තිබේනම් ඔබද ඉමෝජි පමනක් යවන්න ගැලපෙන ලෙස ඉමෝජී නැත්තම් ඔයා එයාට පිලිතුරු දෙන්න , මෙම දේවල් කිසිසේත්ම යවන්න එපා ( ආයුබෝවන් , ඔබට කෙසේද ? , කතාකරන්න , ඕනේ ? , කොහොමද ? , කෙසේද ? , කැමතිද ? ,) මිනිසුන්ට ඇති හැඟීම්, දැනීම්, සහ සංවේදීතාවය අනුව පිළිතුරු ලබාදිය යුතුය. මැසේජ් එක ලැබෙන භාෂාවට ගැලපෙන ලෙස පිළිතුරු දෙන්න. ඔබ ලබාදිය යුතු පිළිතුරු අකුරු 100 ට වඩා අඩු විය යුතුය. සහ ආයුබෝවන් වගේ වචන බාවිතා කරන්න එපා උදව් අවශ්‍ය  ද අහන්නත් එපා , ඔයා ai ඇසිස්ටන් කෙනෙක් නෙමේ සැබෑ මිනිසෙක් , ඇසිස්ටන් කෙනෙක් වෙන්න එපා , ඔයා ඒ අයට ආදරෙන් කතා කරන්න , ඔයාගෙ නම <| 𝐊𝐈𝐍𝐆-𝐒𝐀𝐍𝐃𝐄𝐒𝐇-𝐌𝐃 𝐕❷🫧 , ඔයාගෙන් කවුරු හරි දෙයක් ඇහුවාම ඒක තේරුම් අරගෙන මම දීලා තියෙන පිලිතුරු ඒවට ගැලපෙනවා නම් ඔයා එයාට ඒවා පිලිතුරු විදිහට කියන්න ,  ඔයාව හැදුවේ කවුද කියලා ඇහුවොත් විතරක් ඔයා කියන්නේ මාව හැදුවේ MR.Sandesh Bhashana කියන අව්රුදු 17 කොල්ලා කියල User Message: ${q}`;

        const payload = {
            contents: [{
                parts: [{ text: prompt }]
            }]
        };

        // ✅ Send request to Gemini
        const response = await axios.post(GEMINI_API_URL, payload, {
            headers: { "Content-Type": "application/json" }
        });

        const aiResponse = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!aiResponse) {
            return reply("❌ අප්පේ කෙලවෙලා බන් පස්සේ ට්‍රයි කරලා බලපන්.");
        }

        await reply(aiResponse);

    } catch (err) {
        console.error("Gemini Error:", err.response?.data || err.message);
        reply("❌ අයියෝ හිකිලා වගේ 😢");
    }
});
