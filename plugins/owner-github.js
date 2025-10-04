const handler = async (m, { conn }) => {
  try {
    // 🔹 Detectar texto de distintos tipos de mensaje
    const text =
      m?.message?.conversation ||
      m?.message?.extendedTextMessage?.text ||
      m?.message?.imageMessage?.caption ||
      m?.message?.videoMessage?.caption ||
      ''

    if (!text) {
      console.log('No se detectó texto en el mensaje.')
      return
    }

    // 🔹 Comando debe iniciar con .kill o .eliminar
    const lower = text.trim().toLowerCase()
    if (!lower.startsWith('.kill ') && !lower.startsWith('.eliminar ')) return

    console.log('Comando detectado:', text)

    // 🔹 Verificar permisos
    if (!ALLOWED_SENDERS.includes(m.sender)) {
      console.log('Usuario no permitido:', m.sender)
      await conn.sendMessage(m.chat, { text: '❌ No tienes permiso para usar .kill' }, { quoted: m })
      return
    }

    // 🔹 Parsear path
    const parts = text.trim().split(/\s+/)
    if (parts.length < 2) {
      await conn.sendMessage(m.chat, { text: '❌ Uso: .kill ruta/del/archivo.js' }, { quoted: m })
      return
    }
    const filePath = parts.slice(1).join(' ').replace('--yes', '').trim()

    if (!filePath || filePath.includes('..') || filePath.startsWith('/') || filePath.startsWith('~')) {
      await conn.sendMessage(m.chat, { text: '❌ Ruta inválida.' }, { quoted: m })
      return
    }

    // 🔹 Confirmación
    const requiresConfirm = !text.includes('--yes')
    if (requiresConfirm) {
      await conn.sendMessage(m.chat, { text: `⚠️ Confirma la acción para eliminar *${filePath}*\nUsa: .kill ${filePath} --yes` }, { quoted: m })
      return
    }

    await conn.sendMessage(m.chat, { text: `⏳ Eliminando ${filePath} en ${GITHUB_OWNER}/${GITHUB_REPO} (branch ${DEFAULT_BRANCH})...` }, { quoted: m })

    // 🔹 Ejecutar borrado
    const result = await deleteGithubFile(filePath, {
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      branch: DEFAULT_BRANCH,
      token: GITHUB_TOKEN,
      message: `Delete ${filePath} via bot command by ${m.sender}`
    })

    await conn.sendMessage(m.chat, { text: `✅ Archivo eliminado correctamente.\nCommit: ${result.commit?.sha || 'desconocido'}` }, { quoted: m })
  } catch (err) {
    console.error('ERR .kill:', err)
    await conn.sendMessage(m.chat, { text: `❌ Error borrando archivo: ${err.message}` }, { quoted: m })
  }
}

handler.command = ['eliminar', 'kill']
handler.tags = ['owner']
handler.help = ['kill <ruta>']
export default handler