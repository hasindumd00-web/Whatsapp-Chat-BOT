const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const fs = require("fs");

const SESSION_DIR = "./session";

async function startBot() {
    if (!fs.existsSync(SESSION_DIR)) {
        fs.mkdirSync(SESSION_DIR, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        browser: ["Hasindu AI", "Chrome", "1.0.0"]
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "open") {
            console.log("╔════════════════════════════════╗");
            console.log("║        HASINDU AI ONLINE       ║");
            console.log("║     WhatsApp connection OK     ║");
            console.log("╚════════════════════════════════╝");
        }

        if (connection === "close") {
            const statusCode =
                lastDisconnect?.error?.output?.statusCode;

            if (statusCode !== DisconnectReason.loggedOut) {
                console.log("Connection closed. Reconnecting...");
                setTimeout(startBot, 3000);
            } else {
                console.log("WhatsApp session logged out.");
            }
        }
    });

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const message = messages[0];

        if (!message?.message) return;
        if (message.key.fromMe) return;

        const jid = message.key.remoteJid;

        const text =
            message.message.conversation ||
            message.message.extendedTextMessage?.text ||
            "";

        if (!text.trim()) return;

        console.log(`[MESSAGE] ${jid}: ${text}`);

        /*
         * AI ENGINE WILL BE CONNECTED HERE.
         *
         * We will add:
         * - Hasindu AI model
         * - Conversation memory
         * - Sinhala / English support
         * - .ai command
         * - Song search/download
         * - Other custom commands
         */

        if (text.toLowerCase() === ".ping") {
            await sock.sendMessage(jid, {
                text: "🏓 Hasindu AI Online!"
            });
        }
    });
}

startBot().catch((error) => {
    console.error("Bot startup error:", error);
});
