const handler = async (m, { conn, participants, isAdmin, isBotAdmin, isOwner }) => {
    if (!m.isGroup) return global.dfail('group', m, conn)
    if (!isAdmin && !isOwner) return global.dfail('admin', m, conn)

    const normJid = jid => jid.replace(/(@s\.whatsapp\.net|@lid)$/i, '')

    const autorizados = [
        '59627769213003',
        '59627769213003',
        '151600148549841'
    ]

    if (!autorizados.includes(normJid(m.sender))) {
        return m.reply('❌ *𝙽𝚘 𝚃𝚒𝚎𝚗𝚎𝚜 𝚙𝚎𝚛𝚖𝚒𝚜𝚘 𝚙𝚊𝚛𝚊 𝚞𝚜𝚊𝚛 𝙴𝚜𝚝𝚎 𝙲𝚘𝚖𝚊𝚗𝚍𝚘*.')
    }

    const botJid = conn.user.jid
    const dueños = (global.owner || []).map(([id]) => normJid(id))

    const expulsar = participants
        .filter(p =>
            !p.admin &&
            normJid(p.id) !== normJid(botJid) &&
            normJid(p.id) !== normJid(m.sender) &&
            !dueños.includes(normJid(p.id))
        )
        .map(p => p.id)

    if (!expulsar.length) {
        return m.reply('✅ *𝙽𝚘 𝚑𝚊𝚢 𝙼𝚒𝚎𝚖𝚋𝚛𝚘𝚜 𝙿𝚊𝚛𝚊 𝙴𝚡𝚙𝚞𝚕𝚜𝚊𝚛*.')
    }

    try {
        await conn.groupParticipantsUpdate(m.chat, expulsar, 'remove')
        m.reply(`✅ *𝙰𝚍𝚒𝚘𝚜 𝚊* *${expulsar.length}* *𝙼𝚒𝚎𝚖𝚋𝚛𝚘𝚜*.`)
    } catch (e) {
        console.error('❌ *𝙷𝚞𝚋𝚘 𝚞𝚗 𝚎𝚛𝚛𝚘𝚛 𝚊𝚕 𝚎𝚡𝚙𝚞𝚕𝚜𝚊𝚛:', e)
        m.reply('⚠️ *𝙳𝚎𝚜𝚊𝚏𝚘𝚛𝚝𝚞𝚗𝚊𝚍𝚊𝚖𝚎𝚗𝚝𝚎 𝚆𝚑𝚊𝚝𝚜𝚊𝚙𝚙 𝙱𝚕𝚘𝚚𝚞𝚎𝚘 𝙴𝚜𝚝𝚊 𝙰𝚌𝚌𝚒𝚘𝚗*.')
    }
}

handler.customPrefix = /^(ñaña|vacear|kikoall)$/i
handler.command = new RegExp()
handler.group = true

export default handler;