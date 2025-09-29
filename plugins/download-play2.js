import axios from "axios"
import yts from "yt-search"
import fs from "fs"
import path from "path"
import { promisify } from "util"
import { pipeline } from "stream"

const streamPipe = promisify(pipeline)
const MAX_FILE_SIZE = 60 * 1024 * 1024 // 60 MB
const MAX_DURATION = 10 * 60 // 10 min en segundos

// Función para probar una API y obtener el link
const tryApi = async (name, url) => {
  try {
    const res = await axios.get(url, { timeout: 12000 })
    const link = res.data?.result?.url || res.data?.data?.url
    if (!link) throw new Error("No hay link válido")
    return { url: link, api: name }
  } catch (e) {
    throw new Error(`${name} falló: ${e.message}`)
  }
}

const handler = async (msg, { conn, text }) => {
  if (!text || !text.trim())
    return conn.sendMessage(msg.key.remoteJid, { text: "🎬 Ingresa el nombre de algún video" }, { quoted: msg })

  await conn.sendMessage(msg.key.remoteJid, { react: { text: "🕒", key: msg.key } })

  const search = await yts({ query: text, hl: "es", gl: "MX" })
  const video = search.videos[0]
  if (!video)
    return conn.sendMessage(msg.key.remoteJid, { text: "❌ Sin resultados." }, { quoted: msg })

  // Validar duración
  const parts = video.timestamp.split(':').map(Number)
  const durationSec = parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (durationSec > MAX_DURATION)
    return conn.sendMessage(msg.key.remoteJid, { text: `⚠️ Video muy largo (${video.timestamp}). Límite ${MAX_DURATION / 60} min.` }, { quoted: msg })

  const { url: videoUrl, title, author } = video
  const artista = author.name

  // ⚡ APIs MP4
  const apiPromises = [
    tryApi("Api 1M", `https://mayapi.ooguy.com/ytdl?url=${encodeURIComponent(videoUrl)}&type=mp4&apikey=may-0595dca2`),
    tryApi("Api 2A", `https://api-adonix.ultraplus.click/download/ytmp4?apikey=AdonixKeyz11c2f6197&url=${encodeURIComponent(videoUrl)}`),
    tryApi("Api 3F", `https://api-adonix.ultraplus.click/download/ytmp4?apikey=Adofreekey&url=${encodeURIComponent(videoUrl)}`),
    tryApi("Api 4MY", `https://api-adonix.ultraplus.click/download/ytmp4?apikey=SoyMaycol<3&url=${encodeURIComponent(videoUrl)}`),
    tryApi("Api 5K", `https://api-adonix.ultraplus.click/download/ytmp4?apikey=Angelkk122&url=${encodeURIComponent(videoUrl)}`),
    tryApi("Api 6Srv", `http://173.208.192.170/download/ytmp4?apikey=Adofreekey&url=${encodeURIComponent(videoUrl)}`)
  ]

  let winner
  try {
    winner = await Promise.any(apiPromises)
  } catch (e) {
    return conn.sendMessage(msg.key.remoteJid, { text: "⚠️ No se pudo descargar el video con ninguna API." }, { quoted: msg })
  }

  const videoDownloadUrl = winner.url
  const apiUsada = winner.api

  try {
    const tmpDir = path.join(process.cwd(), "tmp")
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir)
    const filePath = path.join(tmpDir, `${Date.now()}_vid.mp4`)

    const dl = await axios.get(videoDownloadUrl, { responseType: "stream", timeout: 0 })
    let totalSize = 0
    dl.data.on("data", chunk => {
      totalSize += chunk.length
      if (totalSize > MAX_FILE_SIZE) dl.data.destroy()
    })

    await streamPipe(dl.data, fs.createWriteStream(filePath))

    const stats = fs.statSync(filePath)
    if (stats.size > MAX_FILE_SIZE) {
      fs.unlinkSync(filePath)
      throw new Error("El archivo excede el límite de 60 MB permitido por WhatsApp.")
    }

    await conn.sendMessage(
      msg.key.remoteJid,
      {
        video: fs.readFileSync(filePath),
        mimetype: "video/mp4",
        fileName: `${title}.mp4`,
        caption: `
> *𝚈𝚃𝙼𝙿4 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*

⭒ ִֶָ७ ꯭🎵˙⋆｡ - *𝚃𝚒́𝚝𝚞𝚕𝚘:* ${title}
⭒ ִֶָ७ ꯭🎤˙⋆｡ - *𝙰𝚛𝚝𝚒𝚜𝚝𝚊:* ${artista}
⭒ ִֶָ७ ꯭🕑˙⋆｡ - *𝙳𝚞𝚛𝚊𝚌𝚒ó𝚗:* ${video.timestamp}
⭒ ִֶָ७ ꯭📺˙⋆｡ - *𝙲𝚊𝚕𝚒𝚍𝚊𝚍:* 1080
⭒ ִֶָ७ ꯭🌐˙⋆｡ - *𝙰𝚙𝚒:* ${apiUsada}

» 𝙑𝙄𝘿𝙀𝙊 𝙀𝙉𝙑𝙄𝘼𝘿𝙊  🎧
» 𝘿𝙄𝙎𝙁𝙍𝙐𝙏𝘼𝙇𝙊 𝘾𝘼𝙈𝙋𝙀𝙊𝙉..

⇆‌ ㅤ◁ㅤㅤ❚❚ㅤㅤ▷ㅤ↻

> \`\`\`© 𝖯𝗈𝗐𝖾𝗋𝖾𝖽 𝖻𝗒 𝗁𝖾𝗋𝗇𝖺𝗇𝖽𝖾𝗓.𝗑𝗒𝗓\`\`\`
            `.trim(),
        supportsStreaming: true,
        contextInfo: { isHd: true }
      },
      { quoted: msg }
    )

    fs.unlinkSync(filePath)
    await conn.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } })
  } catch (e) {
    console.error(e)
    await conn.sendMessage(msg.key.remoteJid, { text: `⚠️ Error al descargar el video:\n\n${e.message}` }, { quoted: msg })
  }
}

handler.command = ["play2"]
export default handler