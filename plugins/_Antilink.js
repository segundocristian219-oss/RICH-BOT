const linkRegex = /chat\.whatsapp\.com\/(?:invite\/)?([0-9A-Za-z]{20,24})/i

export async function before(m, { conn, isAdmin }) {
    if (m.isBaileys && m.fromMe) return !0
    if (!m.isGroup) return !1

    let chat = global.db.data.chats[m.chat]
    if (!chat.antiLink) return !0

    const body = (m.text || "").toLowerCase()
    const isGroupLink = linkRegex.exec(body)

    if (isGroupLink && !isAdmin) {
        let thisGroupLink = ""
        try {
            thisGroupLink = `https://chat.whatsapp.com/${await this.groupInviteCode(m.chat)}`
        } catch (e) {}

        // no hacer nada si es el link del mismo grupo
        if (thisGroupLink && body.includes(thisGroupLink)) return !0

        try {
            await conn.reply(
                m.chat,
                `*⚠️ _Enlace detectado_*\n\nEl usuario *@${m.sender.split('@')[0]}* será expulsado.`,
                null,
                { mentions: [m.sender] }
            )
        } catch (e) {}

        // intentar borrar mensaje
        try {
            await conn.sendMessage(m.chat, { delete: m.key })
        } catch (e) {}

        // evitar expulsar a owners o al mismo bot
        try {
            const owners = (global.owner || []).map(v => v.replace(/[^0-9]/g, '') + "@s.whatsapp.net")
            if (![...owners, this.user.jid].includes(m.sender)) {
                await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
            }
        } catch (e) {}
    }

    return !0
}