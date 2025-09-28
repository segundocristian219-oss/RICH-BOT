import axios from "axios"
import yts from "yt-search"
import fs from "fs"
import path from "path"
import { promisify } from "util"
import { pipeline } from "stream"

const streamPipe = promisify(pipeline)
const MAX_FILE_SIZE = 60 * 1024 * 1024 // 60 MB

// Intenta una API con abort automático y timeout
const tryApi = (name, url, timeoutMs = 8000) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  return axios.get(url, { signal: controller.signal })
    .then(r => {
      clearTimeout(timeout)
      const link = r.data?.result?.url || r.data?.data?.url
      if (!link || !r.data?.status) throw new Error(`${name}: Sin link válido`)
      return { url: link, api: name }
    })
    .catch(err => {
      clearTimeout(timeout)
      throw new Error(`${name}: ${err.message}`)
    })
}

// Solo 2 APIs confiables para velocidad máxima
const apisList = (videoUrl) => [
  () => tryApi("Api 1M", `https://mayapi.ooguy.com/ytdl?url=${encodeURIComponent(videoUrl)}&type=mp4&apikey=may-0595dca2`),
  () => tryApi("Api 2A", `https://api-adonix.ultraplus.click/download/ytmp4?apikey=AdonixKeyz11c2f6197&url=${encodeURIComponent(videoUrl)}`)
]

// Primera API exitosa con timeout y reintentos inteligentes
const firstSuccessfulApi = async (videoUrl, attempts = 2) => {
  for (let i = 0; i < attempts; i++) {
    try {
      return await Promise.any(apisList(videoUrl).map(api => api()))
    } catch {}
  }
  throw new Error(`⚠️ Todas las APIs fallaron tras ${attempts} intentos rápidos`)
}

const handler = async (msg, { conn, text }) => {
  if (!text?.trim()) return conn.sendMessage(msg.key.remoteJid, { text: "🎬 Ingresa el nombre de algún video" }, { quoted: msg })

  await conn.sendMessage(msg.key.remoteJid, { react: { text: "🕒", key: msg.key } })

  const search = await yts({ query: text, hl: "es", gl: "MX" })
  const video = search.videos[0]
  if (!video) return conn.sendMessage(msg.key.remoteJid, { text: "❌ Sin resultados." }, { quoted: msg })

  const { url: videoUrl, title, timestamp: duration, author } = video
  const artista = author.name

  let winner
  try {
    winner = await firstSuccessfulApi(videoUrl)
  } catch (err) {
    return conn.sendMessage(msg.key.remoteJid, { text: err.message }, { quoted: msg })
  }

  const videoDownloadUrl = winner.url
  const apiUsada = winner.api

  try {
    const tmp = path.join(process.cwd(), "tmp")
    if (!fs.existsSync(tmp)) fs.mkdirSync(tmp)
    const file = path.join(tmp, `${Date.now()}_vid.mp4`)

    // Streaming ultra rápido con control de tamaño
    const dl = await axios.get(videoDownloadUrl, { responseType: "stream", timeout: 0 })
    let totalSize = 0
    dl.data.on("data", chunk => {
      totalSize += chunk.length
      if (totalSize > MAX_FILE_SIZE) dl.data.destroy()
    })

    await streamPipe(dl.data, fs.createWriteStream(file))

    const stats = fs.statSync(file)
    if (stats.size > MAX_FILE_SIZE) {
      fs.unlinkSync(file)
      throw new Error(`⚠️ El archivo excede el límite de ${MAX_FILE_SIZE / (1024*1024)} MB`)
    }

    // Enviar video al instante, como play3
    await conn.sendMessage(msg.key.remoteJid, {
      video: fs.readFileSync(file),
      mimetype: "video/mp4",
      fileName: `${title}.mp4`,
      caption: `
> 𝚅𝙸𝙳𝙴𝙾 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁

⭒ 🎵 Título: ${title}
⭒ 🎤 Artista: ${artista}
⭒ 🕑 Duración: ${duration}
⭒ 🌐 API: ${apiUsada}

» VIDEO ENVIADO 🎧
`.trim(),
      supportsStreaming: true,
      contextInfo: { isHd: true }
    }, { quoted: msg })

    fs.unlinkSync(file)
    await conn.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } })

  } catch (e) {
    console.error(e)
    await conn.sendMessage(msg.key.remoteJid, { text: `⚠️ Error al descargar/enviar el video:\n\n${e.message}` }, { quoted: msg })
  }
}

handler.command = ["play2"]
export default handler