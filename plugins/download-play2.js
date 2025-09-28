import axios from "axios"
import yts from "yt-search"
import fs from "fs"
import path from "path"
import { promisify } from "util"
import { pipeline } from "stream"

const streamPipe = promisify(pipeline)
const MAX_FILE_SIZE = 75 * 1024 * 1024 // 60 MB

// Función auxiliar para probar APIs
const tryApi = async (apiName, urlBuilder) => {
  try {
    const r = await axios.get(urlBuilder(), { timeout: 15000 })
    const link = r.data?.result?.url || r.data?.data?.url
    if (link) return { url: link, api: apiName }
    throw new Error(`${apiName}: No entregó URL válido`)
  } catch (err) {
    throw new Error(`${apiName}: ${err.message}`)
  }
}

const handler = async (msg, { conn, text }) => {
  if (!text || !text.trim())
    return conn.sendMessage(
      msg.key.remoteJid,
      { text: "🎬 Ingresa el nombre de algún video" },
      { quoted: msg }
    )

  await conn.sendMessage(msg.key.remoteJid, { react: { text: "🕒", key: msg.key } })

  const search = await yts({ query: text, hl: "es", gl: "MX" })
  const video = search.videos[0]
  if (!video)
    return conn.sendMessage(
      msg.key.remoteJid,
      { text: "❌ Sin resultados." },
      { quoted: msg }
    )

  const { url: videoUrl, title, timestamp: duration, author } = video
  const artista = author.name

  const apis = [
    () => tryApi("Api 1M", () => `https://mayapi.ooguy.com/ytdl?url=${encodeURIComponent(videoUrl)}&type=mp4&quality=360&apikey=may-0595dca2`),
    () => tryApi("Api 2A", () => `https://api-adonix.ultraplus.click/download/ytmp4?apikey=AdonixKeyz11c2f6197&url=${encodeURIComponent(videoUrl)}&quality=360`),
    () => tryApi("Api 3F", () => `https://api-adonix.ultraplus.click/download/ytmp4?apikey=Adofreekey&url=${encodeURIComponent(videoUrl)}&quality=360`),
    () => tryApi("Api 4MY", () => `https://api-adonix.ultraplus.click/download/ytmp4?apikey=SoyMaycol<3&url=${encodeURIComponent(videoUrl)}&quality=360`),
    () => tryApi("Api 5K", () => `https://api-adonix.ultraplus.click/download/ytmp4?apikey=Angelkk122&url=${encodeURIComponent(videoUrl)}&quality=360`),
    () => tryApi("Api 6Srv", () => `http://173.208.192.170/download/ytmp4?apikey=Adofreekey&url=${encodeURIComponent(videoUrl)}&quality=360`)
  ]

  // Intentar descargar usando la API más rápida
  const tryDownload = async () => {
    let lastError
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await Promise.any(apis.map(api => api()))
      } catch (err) {
        lastError = err
        if (attempt < 3)
          await conn.sendMessage(msg.key.remoteJid, { react: { text: "🔄", key: msg.key } })
        if (attempt === 3) throw lastError
      }
    }
  }

  try {
    const winner = await tryDownload()
    const videoDownloadUrl = winner.url
    const apiUsada = winner.api

    const tmp = path.join(process.cwd(), "tmp")
    if (!fs.existsSync(tmp)) fs.mkdirSync(tmp)
    const file = path.join(tmp, `${Date.now()}_vid.mp4`)

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
      throw new Error("El archivo excede el límite de 60 MB permitido por WhatsApp.")
    }

    await conn.sendMessage(
      msg.key.remoteJid,
      {
        video: { url: file },
        mimetype: "video/mp4",
        fileName: `${title}.mp4`,
        caption: `
> 𝚅𝙸𝙳𝙴𝙾 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁

⭒ 🎵 𝚃𝚒́𝚝𝚞𝚕𝚘: ${title}
⭒ 🎤 𝙰𝚛𝚝𝚒𝚜𝚝𝚊: ${artista}
⭒ 🕑 𝙳𝚞𝚛𝚊𝚌𝚒ó𝚗: ${duration}
⭒ 🌐 𝙰𝚙𝚒: ${apiUsada}

» 𝙑𝙸𝘿𝙀𝙊 𝙀𝙉𝙑𝙄𝘼𝘿𝙊  🎧
» 𝘿𝙄𝙎𝙁𝙍𝙐𝙏𝘼𝙇𝙊 𝘾𝘼𝙈𝙋𝙀𝙊𝙉..

⇆‌ ㅤ◁ㅤㅤ❚❚ㅤㅤ▷ㅤ↻
        `.trim(),
        supportsStreaming: true
      },
      { quoted: msg }
    )

    fs.unlinkSync(file)
    await conn.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } })
  } catch (e) {
    console.error(e)
    await conn.sendMessage(
      msg.key.remoteJid,
      { text: `⚠️ Error al descargar el video:\n\n${e.message}` },
      { quoted: msg }
    )
  }
}

handler.command = ["play2"]
export default handler