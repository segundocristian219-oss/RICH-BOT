export async function before(m, { conn }) {
  if (!m.isGroup) return true

  const chat = global.db.data.chats[m.chat]
  chat.messages = chat.messages || {}

  if (m.message && !m.key.fromMe) {
    chat.messages[m.key.id] = {
      sender: m.sender,
      message: m.message,
      timestamp: m.messageTimestamp
    }
  }

  if (m.messageStubType === 100 && chat.delete) {
    try {
      const deletedUserJid = m.messageStubParameters[0]
      const userTag = `@${deletedUserJid.split('@')[0]}`

      const msgs = Object.entries(chat.messages)
        .filter(([id, msg]) => msg.sender === deletedUserJid)
        .map(([id, msg]) => ({ id, msg }))

      if (msgs.length === 0) return

      await conn.sendMessage(m.chat, {
        text: `⚠️ ${userTag} intentó borrar ${msgs.length > 1 ? 'mensajes' : 'un mensaje'}.`,
        mentions: [deletedUserJid]
      })

      for (let { id, msg } of msgs) {
        await conn.copyNForward(m.chat, msg.message, true)
        delete chat.messages[id]
      }
    } catch (e) {
      console.log('Error en antiborrar:', e)
    }
  }

  return true
}