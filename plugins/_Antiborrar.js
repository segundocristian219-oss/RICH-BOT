export async function before(m, { conn, participants, groupMetadata }) {
  if (!m.isGroup) return true

  const chat = global.db.data.chats[m.chat]
  chat.messages = chat.messages || {}

  // Guardar mensajes entrantes en el historial para antiborrar
  if (m.message && !m.key.fromMe) {
    chat.messages[m.key.id] = {
      sender: m.sender,
      message: m.message,
      timestamp: m.messageTimestamp
    }
  }

  // ANTIBORRAR
  if (m.messageStubType === 100 && chat.delete) { // 100 = mensaje eliminado
    try {
      const deletedUserJid = m.messageStubParameters[0]
      const userTag = `@${deletedUserJid.split('@')[0]}`

      // Recuperar mensaje del historial
      const deletedMsg = chat.messages[m.key.id]
      const content = deletedMsg?.message?.conversation
        || deletedMsg?.message?.extendedTextMessage?.text
        || '*No se pudo recuperar el contenido*'

      await conn.sendMessage(m.chat, {
        text: `⚠️ ${userTag} intentó borrar un mensaje:\n\n${content}`,
        mentions: [deletedUserJid]
      })

      // Opcional: eliminar del historial para no acumular
      delete chat.messages[m.key.id]
    } catch (e) {
      console.log('Error en antiborrar:', e)
    }
  }

  return true
}