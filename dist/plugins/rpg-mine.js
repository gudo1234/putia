const COOLDOWN = 10 * 60 * 1000; // 10 minutos
const frases = [
    "Que pro 😎 has minado",
    "🌟✨ Genial!! Obtienes",
    "WOW!! eres un(a) gran Minero(a) ⛏️ Obtienes",
    "Has Minado!!",
    "😲 Lograste Minar la cantidad de",
    "Tus Ingresos subiran gracias a que minaste",
    "⛏️⛏️⛏️⛏️⛏️ Minando",
    "🤩 SII!!! AHORA TIENES",
    "La minaria esta de tu lado, por ello obtienes",
    "😻 La suerte de Minar",
    "♻️ Tu Mision se ha cumplido, lograste minar",
    "⛏️ La Mineria te ha beneficiado con",
    "🛣️ Has encontrado un Lugar y por minar dicho lugar Obtienes",
    "👾 Gracias a que has minado tus ingresos suman",
    "Felicidades!! Ahora tienes",
    "⛏️⛏️⛏️ Obtienes"
];
export default {
    name: ["minar", "miming", "mine"],
    help: ["minar"],
    desc: "minar XP y ganar recompensas",
    tags: ["econ"],
    register: true,
    run: async ({ m }) => {
        const now = Date.now();
        const { rows: [user] } = await m.db.query("SELECT exp, lastmiming FROM usuarios WHERE id = $1 OR lid = $1", [m.sender]);
        const last = Number(user.lastmiming) || 0;
        const cd = last + COOLDOWN - now;
        if (cd > 0) {
            const min = Math.floor(cd / 60000);
            const seg = Math.floor((cd % 60000) / 1000);
            return m.reply(null, `⏳ Esperá ${min} min ${seg} seg para volver a minar vago`);
        }
        const xp = Math.floor(Math.random() * 6000) + 1; // 1 a 6000
        await m.db.query("UPDATE usuarios SET exp = exp + $1, lastmiming = $2 WHERE id = $3 OR lid = $3", [xp, now, m.sender]);
        const frase = frases[Math.floor(Math.random() * frases.length)];
        m.reply(null, `${frase} *${xp.toLocaleString("es-AR")}* XP`);
    }
};
