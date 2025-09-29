import axios from "axios"
import yts from "yt-search"
import fs from "fs"
import path from "path"
import { promisify } from "util"
import { pipeline } from "stream"

const streamPipe = promisify(pipeline)
const MAX_FILE_SIZE = 60 * 1024 * 1024 // 60 MB
const TIMEOUT_MS = 12000

// ✅ Intentar una API con timeout y abort
const tryApi = async (name, url, timeoutMs = TIMEOUT_MS) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const r = await axios.get(url, { signal: controller.signal })
    clearTimeout(timeout)
    const link = r.data?.result?.url || r.data?.data?.url
    if (!link || !r.data?.status) throw new Error("Sin link válido")
    return { url: link, api: name }
  } catch (err) {
    clearTimeout(timeout)
    throw new Error(`${name}: ${err.message}`)
  }
}

// ⚡ APIs disponibles
const apisList = (videoUrl) => [
  ["MayAPI", `https://mayapi.ooguy.com/ytdl?url=${encodeURIComponent(videoUrl)}&type=mp4&apikey=may-0595dca2`],
  ["AdonixAPI", `https://api-adonix.ultraplus.click/download/ytmp4?apikey=AdonixKeyz11c2f6197&url=${encodeURIComponent(videoUrl)}`],
  ["Adofreekey", `https://api-adonix.ultraplus.click/download/ytmp4?apikey=Adofreekey&url=${encodeURIComponent(videoUrl)}`],
  ["AdonixSrv", `http://173.208.192.170/download/ytmp4?apikey=Adofreekey&url=${encodeURIComponent(videoUrl)}`]
]

const handler = async (msg, { conn, text }) => {
  if (!text?.trim()) {
    return conn.sendMessage(msg.key.remoteJid, { text: "🎬 Ingresa el nombre de algún video" }, { quoted: msg })
  }

  await conn.sendMessage(msg.key.remoteJid, { react: { text: "🕒", key: msg.key } })

  // 🔎 Buscar en YouTube
  const search = await yts({ query: text, hl: "es", gl: "MX" })
  const video = search.videos[0]
  if (!video) {
    return conn.sendMessage(msg.key.remoteJid, { text: "❌ Sin resultados." }, { quoted: msg })
  }

  const { url: videoUrl, title, timestamp: duration, author } = video
  const artista = author.name

  // 🔁 Intentar hasta 3 APIs
  let winner = null
  for (let i = 0; i < Math.min(3, apisList(videoUrl).length); i++) {
    const [name, url] = apisList(videoUrl)[i]
    try {
      winner = await tryApi(name, url)
      break
    } catch (err) {
      console.warn(`❌ Falló ${name}:`, err.message)
      await conn.sendMessage(msg.key.remoteJid, { react: { text: "🏜️", key: msg.key } })
    }
  }

  if (!winner) {
    return conn.sendMessage(msg.key.remoteJid, { text: "⚠️ Todas las APIs fallaron (3 intentos)" }, { quoted: msg })
  }

  const videoDownloadUrl = winner.url
  const apiUsada = winner.api

  const caption = `
> 𝚅𝙸𝙳𝙴𝙾 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁

⭒ 🎵 𝚃𝚒́𝚝𝚞𝚕𝚘: ${title}
⭒ 🎤 𝙰𝚛𝚝𝚒𝚜𝚝𝚊: ${artista}
⭒ 🕑 𝙳𝚞𝚛𝚊𝚌𝚒ó𝚗: ${duration}
⭒ 🌐 𝙰𝚙𝚒: ${apiUsada}

» 𝙑𝙸𝘿𝙀𝙊 𝙀𝙉𝙑𝙄𝘼𝘿𝙊 🎧
» 𝘿𝙄𝙎𝙁𝙍𝙐𝙏𝘼𝙇𝙊 𝘾𝘼𝙈𝙋𝙀𝙊𝙉..

⇆ ㅤ◁ㅤ❚❚ㅤ▷ㅤ↻
`.trim()

  try {
    // 🚀 Intentar enviar directo por URL
    try {
      await conn.sendMessage(
        msg.key.remoteJid,
        {
          video: { url: videoDownloadUrl },
          mimetype: "video/mp4",
          fileName: `${title}.mp4`,
          caption,
          supportsStreaming: true
        },
        { quoted: msg }
      )
    } catch (directErr) {
      console.warn("❌ Falló envío directo, usando fallback tmp:", directErr.message)

      // 📂 Carpeta tmp
      const tmp = path.join(process.cwd(), "tmp")
      if (!fs.existsSync(tmp)) fs.mkdirSync(tmp)
      const file = path.join(tmp, `${Date.now()}_vid.mp4`)

      // 📥 Descargar con streaming
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
        throw new Error(`⚠️ El archivo excede ${MAX_FILE_SIZE / (1024*1024)} MB`)
      }

      // 📤 Enviar desde archivo
      await conn.sendMessage(
        msg.key.remoteJid,
        {
          video: fs.readFileSync(file),
          mimetype: "video/mp4",
          fileName: `${title}.mp4`,
          caption,
          supportsStreaming: true,
          contextInfo: { isHd: true }
        },
        { quoted: msg }
      )

      fs.unlinkSync(file)
    }

    await conn.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } })
  } catch (e) {
    console.error(e)
    await conn.sendMessage(msg.key.remoteJid, { text: `⚠️ Error al enviar el video:\n\n${e.message}` }, { quoted: msg })
  }
}

handler.command = ["play2"]
export default handler