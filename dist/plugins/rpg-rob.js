import { db } from "../lib/db.js";
const MAX_ROB = 100000;
const COOLDOWN = 30 * 60 * 1000; // 1 hora
function cleanJid(jid = '') {
    return String(jid || '').replace(/:\d+/, '');
}
function onlyNum(v = '') {
    return String(v || '').replace(/[^0-9]/g, '');
}
export default {
    name: ["rob", "robar"],
    help: ["rob @user"],
    desc: "robar XP a otro usuario",
    tags: ["econ"],
    register: true,
    run: async ({ conn, m, mentionedJid }) => {
        try {
            const now = Date.now();
            const { rows: [robber] } = await db.query("SELECT exp, lastrob FROM usuarios WHERE id = $1 OR lid = $1", [m.sender]);
            const robberData = (robber || {});
            const lastRob = Number(robberData.lastrob || 0);
            const timeLeft = lastRob + COOLDOWN - now;
            if (timeLeft > 0) {
                const h = Math.floor(timeLeft / 3600000);
                const mLeft = Math.floor((timeLeft % 3600000) / 60000);
                return m.reply(null, `🚓 Policía te tiene en la mira. Volvé en ${h}h ${mLeft}min`);
            }
            let who = mentionedJid?.[0] ||
                m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
                m.quoted?.sender;
            if (who && who.endsWith("@lid")) {
                const meta = await conn.groupMetadata(m.chat);
                const participant = meta.participants.find(p => p.lid === who || p.id === who);
                if (participant?.id) {
                    who = participant.id;
                }
                else {
                    const number = who.replace(/@lid$/, "");
                    who = `${number}@s.whatsapp.net`;
                }
            }
            if (!who) {
                return m.reply(null, "Etiquetá a alguien o respondé un mensaje para robarle pelotudo");
            }
            if (who === m.sender) {
                return m.reply(null, "¿Tu padres son primos? como te vas a robar vos mismo virgen");
            }
            const whoNum = onlyNum(who);
            // ✅ BUSCAR USUARIO CON db
            const resUser = await db.query(`SELECT * FROM usuarios WHERE id = $1 OR lid = $1 OR num = $2`, [who, whoNum]);
            if (resUser.rows.length === 0) {
                const fallback = await db.query(`SELECT * FROM usuarios WHERE num = $1`, [whoNum]);
                if (fallback.rows.length === 0) {
                    return m.reply(null, "¿quien puta es ese?");
                }
                resUser.rows = fallback.rows;
            }
            const victimData = resUser.rows[0];
            // ✅ OBTENER EL NÚMERO REAL PARA EL TAG
            let realNum = '';
            let realJid = '';
            // Primero intentar con el num de la base de datos
            if (victimData.num && typeof victimData.num === 'string') {
                realNum = victimData.num;
            }
            // Si no tiene num, intentar con el id
            else if (victimData.id && typeof victimData.id === 'string') {
                const numFromId = onlyNum(victimData.id);
                if (numFromId && numFromId.length >= 10) {
                    realNum = numFromId;
                }
            }
            // Si no, usar el whoNum pero limpiarlo
            else {
                realNum = whoNum;
            }
            // ✅ CONSTRUIR EL JID REAL PARA LA MENCIÓN
            realJid = `${realNum}@s.whatsapp.net`;
            console.log("🔍 realNum:", realNum, "realJid:", realJid);
            // ✅ OBTENER lid COMO STRING
            let victimLid = '';
            if (victimData.lid && typeof victimData.lid === 'string') {
                victimLid = victimData.lid;
            }
            else if (victimData.id && typeof victimData.id === 'string') {
                victimLid = victimData.id;
            }
            else {
                victimLid = String(who);
            }
            console.log("🔍 victimLid:", victimLid, "type:", typeof victimLid);
            const xpVictim = Number(victimData.exp) || 0;
            if (xpVictim < 100) {
                return m.reply(`@${realNum}`, `es más pobre que vos, no tiene ni 100 XP`);
            }
            const robado = Math.floor(Math.random() * MAX_ROB) + 1;
            const cantidad = Math.min(robado, xpVictim);
            await db.query("UPDATE usuarios SET exp = exp + $1, lastrob = $2 WHERE id = $3", [cantidad, now, m.sender]);
            await db.query("UPDATE usuarios SET exp = exp - $1 WHERE lid = $2 OR id = $2", [cantidad, victimLid]);
            await m.reply(`*Robaste ${cantidad.toLocaleString("es-AR")} XP* a @${realNum}`);
        }
        catch (e) {
            m.react("🚓");
            console.error("❌ Error en rob:", e);
        }
    }
};
