const { muteCommand } = require('./commands/mute');
const { isAdmin } = require('./lib/isAdmin');

const channelInfo = {
    contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363161513685998@newsletter',
            newsletterName: 'KnightBot MD',
            serverMessageId: -1
        }
    }
};

async function handleMessages(sock, messageUpdate) {
    try {
        const { messages, type } = messageUpdate;
        if (type !== 'notify') return;

        const message = messages[0];
        if (!message?.message) return;

        const chatId = message.key.remoteJid;
        const senderId = message.key.participant || message.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');

        const userMessage = (
            message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            ''
        ).toLowerCase().trim();

        if (!userMessage.startsWith('.')) return;

        switch (true) {
            case userMessage.startsWith('.mute'):
                {
                    if (!isGroup) {
                        await sock.sendMessage(chatId, { text: '❌ This command only works in groups.', ...channelInfo }, { quoted: message });
                        break;
                    }

                    // check admin status
                    const adminStatus = await isAdmin(sock, chatId, senderId, message);
                    if (!adminStatus.isBotAdmin) {
                        await sock.sendMessage(chatId, { text: '❌ Please make the bot an admin to use .mute.', ...channelInfo }, { quoted: message });
                        break;
                    }
                    if (!adminStatus.isSenderAdmin && !message.key.fromMe) {
                        await sock.sendMessage(chatId, { text: '❌ Only group admins can use .mute.', ...channelInfo }, { quoted: message });
                        break;
                    }

                    // parse argument for duration
                    const parts = userMessage.trim().split(/\s+/);
                    const muteArg = parts[1];
                    const muteDuration = muteArg !== undefined ? parseInt(muteArg, 10) : undefined;

                    if (muteArg !== undefined && (isNaN(muteDuration) || muteDuration <= 0)) {
                        await sock.sendMessage(chatId, {
                            text: '❌ Please provide a valid number of minutes or use .mute with no number to mute immediately.',
                            ...channelInfo
                        }, { quoted: message });
                    } else {
                        await muteCommand(sock, chatId, senderId, message, muteDuration);
                    }
                }
                break;
        }
    } catch (error) {
        console.error('❌ Error in message handler:', error.message);
    }
}

module.exports = { handleMessages };
