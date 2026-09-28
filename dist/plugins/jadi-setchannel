import { FORCED_NEWSLETTER_JID, FORCED_NEWSLETTER_NAME } from "../lib/db.js";

export default {
    name: ["setchannel", "setnewsletter"],
    help: ["setchannel", "setnewsletter"],
    desc: "Muestra el canal fijo usado en los mensajes forwardeados.",
    tags: ["jadibot"],
    owner: true,
    run: async ({ m }) => {
        return m.reply(`📢 *CANAL FIJO DEL BOT*\n\n` +
            `📛 *Nombre:* ${FORCED_NEWSLETTER_NAME}\n` +
            `🆔 *JID:* ${FORCED_NEWSLETTER_JID}\n` +
            `📊 *Estado:* ✅ Activo\n\n` +
            `🔒 El canal está forzado desde *dist/lib/db.js* y se aplica a todos los bots y sub-bots.`);
    }
};
