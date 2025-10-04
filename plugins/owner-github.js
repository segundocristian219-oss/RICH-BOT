import fetch from 'node-fetch'

/**
 * Configuración — pon tus valores o usa variables de entorno
 */
const GITHUB_TOKEN = process.env.GITHUB_TOKEN // obligatorio
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'tu-usuario-o-org'
const GITHUB_REPO = process.env.GITHUB_REPO || 'tu-repo'
const DEFAULT_BRANCH = 'main'

// Lista de JIDs que pueden usar el .kill (cambia por los tuyos)
const ALLOWED_SENDERS = [
  '521xxxxxxxxxx@s.whatsapp.net', // tu número
  // 'otraJid@s.whatsapp.net'
]

/** Helper: eliminar archivo usando GitHub API */
async function deleteGithubFile(path, options = {}) {
  const { owner = GITHUB_OWNER, repo = GITHUB_REPO, branch = DEFAULT_BRANCH, token = GITHUB_TOKEN, message } = options

  if (!token) throw new Error('No existe GITHUB_TOKEN en las variables de entorno.')

  const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`

  // 1) Obtener el sha actual del archivo
  const getRes = await fetch(`${apiBase}?ref=${encodeURIComponent(branch)}`, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'DS6-Delete-File-Bot'
    }
  })

  if (getRes.status === 404) throw new Error('Archivo no encontrado en el repo.')
  if (!getRes.ok) {
    const t = await getRes.text()
    throw new Error(`Error al obtener archivo: ${getRes.status} ${getRes.statusText} - ${t}`)
  }

  const fileInfo = await getRes.json()
  const sha = fileInfo.sha
  if (!sha) throw new Error('No se pudo obtener el sha del archivo.')

  // 2) Hacer DELETE con message y sha
  const body = {
    message: message || `Delete ${path} via bot`,
    sha,
    branch
  }

  const delRes = await fetch(apiBase, {
    method: 'DELETE',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'DS6-Delete-File-Bot',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!delRes.ok) {
    const t = await delRes.text()
    throw new Error(`Error al eliminar: ${delRes.status} ${delRes.statusText} - ${t}`)
  }

  const delJson = await delRes.json()
  return delJson
}

/** Handler DS6: .kill <path> */
const handler = async (m, { conn }) => {
  try {
    // solo si es comando .kill al inicio del mensaje
    const text =
      m?.message?.extendedTextMessage?.text ||
      m?.message?.conversation ||
      ''
    if (!text) return
    if (!text.trim().toLowerCase().startsWith('.kill ')) return

    // permisos: solo allowed senders
    if (!ALLOWED_SENDERS.includes(m.sender)) {
      await conn.sendMessage(m.chat, { text: '❌ No tienes permiso para usar .kill' }, { quoted: m })
      return
    }

    // parsear argumento
    const parts = text.trim().split(/\s+/)
    // .kill archivo.js OR .kill path/to/file.js
    if (parts.length < 2) {
      await conn.sendMessage(m.chat, { text: '❌ Uso: .kill ruta/del/archivo.js' }, { quoted: m })
      return
    }
    const filePath = parts.slice(1).join(' ').trim() // conservamos espacios en nombre si hay

    // validación básica / sanitización
    if (!filePath) {
      await conn.sendMessage(m.chat, { text: '❌ Ruta inválida.' }, { quoted: m })
      return
    }
    if (filePath.includes('..') || filePath.startsWith('/') || filePath.startsWith('~')) {
      await conn.sendMessage(m.chat, { text: '❌ Ruta no permitida.' }, { quoted: m })
      return
    }
    // opcional: forzar que esté dentro de plugins/
    // if (!filePath.startsWith('plugins/')) { ... reject ... }

    // confirmación mínima: requiere que el comando incluya --yes para evitar borrados accidentales
    const requiresConfirm = !text.includes('--yes')
    if (requiresConfirm) {
      await conn.sendMessage(m.chat, { text: `⚠️ Confirma la acción para eliminar *${filePath}*\nUsa: .kill ${filePath} --yes` }, { quoted: m })
      return
    }

    // notificar inicio
    await conn.sendMessage(m.chat, { text: `⏳ Eliminando ${filePath} en ${GITHUB_OWNER}/${GITHUB_REPO} (branch ${DEFAULT_BRANCH})...` }, { quoted: m })

    // Ejecutar borrado
    const result = await deleteGithubFile(filePath, {
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      branch: DEFAULT_BRANCH,
      token: GITHUB_TOKEN,
      message: `Delete ${filePath} via bot command by ${m.sender}`
    })

    // éxito
    await conn.sendMessage(m.chat, { text: `✅ Archivo eliminado correctamente.\nCommit: ${result.commit?.sha || 'desconocido'}` }, { quoted: m })
  } catch (err) {
    console.error('ERR .kill:', err)
    await conn.sendMessage(m.chat, { text: `❌ Error borrando archivo: ${err.message}` }, { quoted: m })
  }
}

handler.command = /.*/ // o especifica si tu framework lo requiere
handler.tags = ['owner']
handler.help = ['kill <ruta>']
export default handler