const COOLDOWN = 60 * 60 * 1000; // 1 hora
const robar = [
    "Robaste un banco y obtuviste",
    "Negociaste con el jefe de la mafia y obtuviste",
    "Casi te atrapa la polic��a, pero lograste escapar con",
    "Los mafiosos te pagaron",
    "Le robaste a un famoso y conseguiste",
    "Entraste a un museo y robaste",
    "Infiltraste una joyer��a y te llevaste",
    "Asaltaste un cami��n blindado y conseguiste",
    "Secuestraste a un empresario y recibiste",
    "Amenazaste a un pol��tico y obtuviste"
];
const robmal = [
    "La polic��a te atrap�� y perdiste",
    "Tu c��mplice te traicion�� y perdiste",
    "Fallaste el escape y perdiste",
    "La alarma se activ�� y perdiste",
    "Te descubrieron y perdiste",
    "El plan sali�� mal y perdiste"
];
export default {
    name: ["crime", "crimen"],
    help: ["crime"],
    tags: ["econ"],
    register: true,
    group: true,
    run: async ({ conn, m }) => {
        if (!m.db)
            return;
        try {
            const now = Date.now();
            const { rows: [user] } = await m.db.query("SELECT exp, limite, crime FROM usuarios WHERE id = $1", [m.sender]);
            if (!user) {
                return m.reply("?? Reg��strate primero con /reg");
            }
            /* ========= NORMALIZAR TIEMPO (ANTI BUG) ========= */
            let lastCrime = Number(user.crime) || 0;
            // si vino en segundos �� pasar a ms
            if (lastCrime > 0 && lastCrime < 1e12) {
                lastCrime = lastCrime * 1000;
            }
            // si est�� corrupto (futuro)
            if (lastCrime > now) {
                lastCrime = 0;
                await m.db.query("UPDATE usuarios SET crime = 0 WHERE id = $1", [m.sender]);
            }
            let timeLeft = lastCrime + COOLDOWN - now;
            // protecci��n final
            if (timeLeft > 0 && timeLeft <= COOLDOWN) {
                return m.reply(`? Te tienen fichado.\n? Volv�� en *${msToTime(timeLeft)}*`);
            }
            /* ========= PARTICIPANTES (ANTI CRASH) ========= */
            let participants = [];
            try {
                const meta = await conn.groupMetadata(m.chat);
                participants = meta.participants
                    .map(p => p.id)
                    .filter(id => id !== m.sender);
            }
            catch {
                participants = [];
            }
            const randomTarget = participants.length > 0
                ? participants[Math.floor(Math.random() * participants.length)]
                : null;
            /* ========= RANDOM ========= */
            const exp = Math.floor(Math.random() * 7000) + 500;
            const diam = Math.floor(Math.random() * 30) + 5;
            const tipo = Math.floor(Math.random() * 5);
            let text = "";
            let mentions = [m.sender];
            switch (tipo) {
                case 0: // gana EXP
                    text = `? ${pickRandom(robar)} *${exp.toLocaleString()} XP*`;
                    await m.db.query("UPDATE usuarios SET exp = exp + $1, crime = $2 WHERE id = $3", [exp, now, m.sender]);
                    break;
                case 1: // pierde EXP
                    text = `? ${pickRandom(robmal)} *${exp.toLocaleString()} XP*`;
                    await m.db.query("UPDATE usuarios SET exp = GREATEST(exp - $1, 0), crime = $2 WHERE id = $3", [exp, now, m.sender]);
                    break;
                case 2: // gana diamantes
                    text = `? ${pickRandom(robar)} *${diam}* ${m.e.currency_name}`;
                    await m.db.query("UPDATE usuarios SET limite = limite + $1, crime = $2 WHERE id = $3", [diam, now, m.sender]);
                    break;
                case 3: // pierde diamantes
                    text = `? ${pickRandom(robmal)} *${diam}* ${m.e.currency_name}`;
                    await m.db.query("UPDATE usuarios SET limite = GREATEST(limite - $1, 0), crime = $2 WHERE id = $3", [diam, now, m.sender]);
                    break;
                case 4: // roba a alguien
                    if (!randomTarget) {
                        text = "? Intentaste robar�� pero no hab��a a qui��n";
                        await m.db.query("UPDATE usuarios SET crime = $1 WHERE id = $2", [now, m.sender]);
                        break;
                    }
                    text = `? Le robaste *${exp.toLocaleString()} XP* a @${randomTarget.split("@")[0]}`;
                    mentions.push(randomTarget);
                    await m.db.query("UPDATE usuarios SET exp = exp + $1, crime = $2 WHERE id = $3", [exp, now, m.sender]);
                    await m.db.query("UPDATE usuarios SET exp = GREATEST(exp - $1, 0) WHERE id = $2", [Math.min(500, exp), randomTarget]);
                    break;
            }
            await conn.sendMessage(m.chat, { text, mentions }, { quoted: m });
        }
        catch (err) {
            console.error("crime error:", err);
            m.reply("?? Ocurri�� un error al ejecutar el crimen.");
        }
    }
};
/* ========= UTILS ========= */
function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
}
function msToTime(ms) {
    if (!ms || ms <= 0)
        return "0s";
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const sec = s % 60;
    const min = m % 60;
    if (h > 0)
        return `${h}h ${min}m ${sec}s`;
    if (min > 0)
        return `${min}m ${sec}s`;
    return `${sec}s`;
}
