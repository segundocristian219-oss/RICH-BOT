export async function before(m, { conn, participants, groupMetadata }) {
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

      const deletedMsg = chat.messages[m.key.id]
      if (!deletedMsg) return

      await conn.sendMessage(m.chat, {
        text: `⚠️ ${userTag} intentó borrar un mensaje.`,
        mentions: [deletedUserJid]
      })

      await conn.copyNForward(m.chat, deletedMsg.message, true)

      delete chat.messages[m.key.id]
    } catch (e) {
      console.log('Error en antiborrar:', e)
    }
  }

  return true
}