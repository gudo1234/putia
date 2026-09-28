const items = ['exp', 'limite'];
let confirmation = {};
export default {
    name: ["transfer", "pay", "dar", "transferir"],
    help: ["transfer <tipo> <cantidad> @tag"],
    desc: "transferir XP o monedas a otro usuario",
    tags: ["econ"],
    register: true,
    run: async ({ conn, m, args, mentionedJid, prefijo }) => {
        if (confirmation[m.sender])
            return m.reply("Ya estás haciendo una transferencia, terminá esa mierda primero");
        const { rows: [user] } = await m.db.query("SELECT exp, limite FROM usuarios WHERE id = $1", [m.sender]);
        const tipo = (args[0] || '').toLowerCase();
        if (!items.includes(tipo)) {
            return m.reply(`${m.e.warn} Solo podés transferir:\n• exp → Experiencia\n• limite → ${m.e.currency_emoji} ${m.e.currency_name}\n\nEjemplo: ${prefijo}transfer exp 500 @tag`);
        }
        const count = Math.max(1, Number(args[1]) || 1);
        if (isNaN(count) || count < 1)
            return m.reply("Pon una cantidad válida mayor a 0");
        let who = mentionedJid?.[0] ||
            m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
            m.quoted?.sender;
        if (who && who.endsWith('@lid')) {
            const meta = await conn.groupMetadata(m.chat);
            const participant = meta.participants.find(p => p.lid === who || p.id === who);
            if (participant && participant.id) {
                who = participant.id;
            }
            else {
                const number = who.replace(/@lid$/, '');
                who = number + '@s.whatsapp.net';
            }
        }
        ;
        if (!who)
            return m.reply("Etiquetá al usuario o pon su número");
        if (who === m.sender)
            return m.reply("No te transferís a vos mismo, pelotudo");
        const { rows: [target] } = await m.db.query("SELECT exp, limite FROM usuarios WHERE id = $1", [who]);
        if (!target)
            return m.reply("Ese usuario no está registrado, no le podés pasar nada");
        if (user[tipo] < count) {
            return m.reply(`No tenés ni ${count} ${tipo.toUpperCase()}, pobre`);
        }
        const confirmTxt = `VAS A TRANSFERIR:\n` +
            `→ ${count} ${tipo === 'limite' ? m.e.currency_emoji + ' ' + m.e.currency_name : tipo.toUpperCase()}\n` +
            `→ A: @${who.split('@')[0]}\n\n` +
            `Escribí *si* para confirmar o *no* para cancelar\n` +
            `Tenés 60 segundos.`;
        await m.reply(confirmTxt, { mentions: [who] });
        confirmation[m.sender] = {
            sender: m.sender,
            to: who,
            type: tipo,
            count,
            timeout: setTimeout(() => {
                m.reply("Se te acabó el tiempo, boludo");
                delete confirmation[m.sender];
            }, 60_000)
        };
    },
    before: async (m) => {
        const data = confirmation[m.sender];
        if (!data)
            return;
        const { timeout, sender, to, type, count } = data;
        if (/^no$/i.test(m.text)) {
            clearTimeout(timeout);
            delete confirmation[sender];
            return m.reply("Transferencia cancelada");
        }
        if (/^si$/i.test(m.text)) {
            clearTimeout(timeout);
            const { rows: [fromUser] } = await m.db.query(`SELECT ${type} FROM usuarios WHERE id = $1`, [sender]);
            if (!fromUser || fromUser[type] < count) {
                delete confirmation[sender];
                return m.reply("Ya no tenés suficiente, se canceló");
            }
            await m.db.query(`UPDATE usuarios SET ${type} = ${type} - $1 WHERE id = $2`, [count, sender]);
            await m.db.query(`UPDATE usuarios SET ${type} = ${type} + $1 WHERE id = $2`, [count, to]);
            m.reply(`✅ Transferiste ${count} ${type === 'limite' ? m.e.currency_emoji : type.toUpperCase()} a @${to.split('@')[0]}`, { mentions: [to] });
            delete confirmation[sender];
        }
    }
};
