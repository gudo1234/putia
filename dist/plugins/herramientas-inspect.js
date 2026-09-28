export default {
    name: "inspect",
    help: ["inspect <link o id>"],
    desc: "Obtiene la información de un grupo o canal de WhatsApp.",
    tags: ["tools"],
    register: true,
    run: async ({ conn, m, args, prefijo, cmd }) => {
        const input = args[0];
        if (!input)
            return m.reply(`${m.e.warn} *Debes proporcionar un enlace de un canal o grupos.*\nEjemplo: ${prefijo + cmd} https://whatsapp.com/channel/...`);
        await m.react("⌛");
        try {
            const isChannel = /whatsapp\.com\/channel\//i.test(input);
            const isGroupLink = /chat\.whatsapp\.com\//i.test(input);
            let infoText = "";
            let thumb = null;
            // ===== CANAL =====
            if (isChannel) {
                const invite = input.split("/channel/")[1]?.split(/[?#]/)[0];
                if (!invite)
                    return m.reply(m.e.error + " No pude extraer el código del canal.");
                const data = await conn.newsletterMetadata("invite", invite);
                const meta = data.thread_metadata;
                infoText += `📢 *INFORMACIÓN DEL CANAL*\n\n`;
                infoText += `📛 *Nombre:* ${meta.name?.text || "Desconocido"}\n`;
                infoText += `🆔 *ID:* ${data.id}\n`;
                infoText += `🔖 *Estado:* ${data.state?.type || "Desconocido"}\n`;
                infoText += `✅ *Verificación:* ${meta.verification || "Desconocido"}\n`;
                infoText += `🗓️ *Creado:* ${new Date(Number(meta.creation_time) * 1000).toLocaleString("es-AR")}\n`;
                infoText += `👥 *Suscriptores:* ${meta.subscribers_count || "?"}\n`;
                infoText += `🔗 *Invitación:* https://whatsapp.com/channel/${meta.invite}\n`;
                infoText += `⚙️ *Handle:* ${meta.handle || "No asignado"}\n`;
                infoText += `⚙️ *Settings:* ${meta.settings ? JSON.stringify(meta.settings) : "No disponibles"}\n\n`;
                if (meta.description?.text)
                    infoText += `📄 *Descripción:*\n${meta.description.text.trim()}\n`;
                thumb = meta.preview?.direct_path ? `https://mmg.whatsapp.net${meta.preview.direct_path}` : null;
                if (thumb) {
                    await conn.sendMessage(m.chat, { image: { url: thumb }, caption: infoText.trim() }, { quoted: m });
                }
                else {
                    await conn.sendMessage(m.chat, { text: infoText.trim() }, { quoted: m });
                }
                await m.reply(data.id);
                await m.react("✅");
                return;
            }
            // ===== GRUPO =====
            if (isGroupLink) {
                const code = input.split("chat.whatsapp.com/")[1]?.split(/[?#]/)[0];
                if (!code)
                    return m.reply(m.e.error + " No pude extraer el código del grupo.");
                let data;
                try {
                    data = await conn.groupGetInviteInfo(code);
                }
                catch (e) {
                    console.error("❌ Error obteniendo info del grupo:", e);
                    return m.reply(`❌ No se pudo obtener la información del grupo.\n\n*Motivo:* ${e.message || 'bad-request'}\n\n💡 El enlace puede haber expirado o ser inválido.`);
                }
                if (!data || !data.id) {
                    return m.reply(`❌ No se pudo obtener información del grupo.\n\n💡 El enlace puede haber expirado o ser inválido.`);
                }
                // CANTIDAD REAL DE MIEMBROS (data.size)
                const totalMembers = data.size || data.participants?.length || 0;
                const admins = data.participants?.filter(p => p.admin).length || 0;
                // EPHEMERAL EN FORMATO LEGIBLE
                let ephemeralText = "Desactivado";
                if (data.ephemeralDuration) {
                    const seconds = data.ephemeralDuration;
                    if (seconds >= 86400) {
                        const days = seconds / 86400;
                        ephemeralText = `${days} día${days > 1 ? 's' : ''}`;
                    }
                    else if (seconds >= 3600) {
                        const hours = seconds / 3600;
                        ephemeralText = `${hours} hora${hours > 1 ? 's' : ''}`;
                    }
                    else if (seconds >= 60) {
                        const mins = seconds / 60;
                        ephemeralText = `${mins} minuto${mins > 1 ? 's' : ''}`;
                    }
                    else {
                        ephemeralText = `${seconds} segundo${seconds > 1 ? 's' : ''}`;
                    }
                }
                let announceText = data.announce ? "❌ Solo admins pueden enviar mensajes" : "✅";
                infoText += `👥 *INFORMACIÓN DEL GRUPO*\n\n`;
                infoText += `📛 *Nombre:* ${data.subject || "Desconocido"}\n`;
                infoText += `🆔 *ID:* ${data.id}\n`;
                infoText += `👑 *Creador:* ${data.ownerPn || data.owner || "Desconocido"}\n`;
                infoText += `📅 *Creado:* ${data.creation ? new Date(data.creation * 1000).toLocaleString("es-AR") : "Desconocido"}\n`;
                infoText += `👥 *Miembros:* ${totalMembers}\n`;
                infoText += `🛡️ *Admins:* ${admins}\n`;
                infoText += `⚙️ *Restrict:* ${data.restrict ? "✅ Activado" : "❌ Desactivado"}\n`;
                infoText += `📢 *Mensajes:* ${announceText}\n`;
                infoText += `👥 *Aprobación al unirse:* ${data.joinApprovalMode ? "✅ Sí" : "❌ No"}\n`;
                infoText += `➕ *Agregar miembros:* ${data.memberAddMode ? "✅ Sí" : "❌ No"}\n`;
                infoText += `💾 *Mensajes temporales:* ${ephemeralText}\n`;
                infoText += `🏠 *Comunidad:* ${data.isCommunity ? "✅" : "❌"}\n`;
                infoText += `🔗 *Link:* ${input}\n\n`;
                infoText += `💬 *Descripción:*\n${data.desc || "Sin descripción"}`;
                thumb = data.picture || null;
                if (thumb) {
                    await conn.sendMessage(m.chat, { image: { url: thumb }, caption: infoText.trim() }, { quoted: m });
                }
                else {
                    await conn.sendMessage(m.chat, { text: infoText.trim() }, { quoted: m });
                }
                await m.react("✅");
                return;
            }
            return m.reply(`${m.e.warn} *Formato no válido.*\nUsa un enlace de grupo o canal de WhatsApp.`);
        }
        catch (e) {
            console.error("❌ Error en inspect:", e);
            await m.react("❌");
            let errorMsg = e.message || 'Error desconocido';
            if (errorMsg.includes('bad-request')) {
                errorMsg = 'El enlace del grupo no es válido o ha expirado.\n\n💡 Verificá que el enlace sea correcto y que el grupo exista.';
            }
            await m.reply(`${m.e.error} ${errorMsg}`);
        }
    }
};
