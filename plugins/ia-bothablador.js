const handler = async (m, { conn }) => {
  try {
    const botJid = conn.user?.id?.split(':')[0] + '@s.whatsapp.net'
    const botName = conn.user?.name?.toLowerCase() || 'baki bot'

    const mentioned = m?.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
    const text = (
      m?.message?.extendedTextMessage?.text ||
      m?.message?.conversation ||
      ''
    ).trim()

    // 💥 Detecta si el bot fue mencionado realmente o con texto plano
    const isMentioned =
      mentioned.includes(botJid) ||
      text.toLowerCase().includes(`@${botName.toLowerCase()}`) ||
      text.toLowerCase().includes(botName.toLowerCase())

    if (!isMentioned) return // No se mencionó al bot, no responde

    // Limpia el texto del nombre o mención
    const cleanText = text.replace(/@\S+/g, '').replace(new RegExp(botName, 'gi'), '').trim()
    if (!cleanText) return

    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

    // 🔹 Ejemplo de respuesta rápida (puedes cambiar por Gemini u otra cosa)
    const respuesta = `Hola @${m.pushName || 'usuario'} 👋  
Me llamaste diciendo: *${cleanText}*`

    await conn.sendMessage(m.chat, { text: respuesta, mentions: [m.sender] }, { quoted: m })
    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (e) {
    console.error(e)
    await conn.sendMessage(m.chat, { text: `❌ Error: ${e.message}` }, { quoted: m })
  }
}

handler.help = ['mencion']
handler.tags = ['ai']
handler.command = /^(mencion)$/i
export default handler