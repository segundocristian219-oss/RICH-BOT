import axios from "axios"
import yts from "yt-search"
import fs from "fs"
import path from "path"
import { promisify } from "util"
import { pipeline } from "stream"

const streamPipe = promisify(pipeline)
const MAX_FILE_SIZE = 60 * 1024 * 1024
const TIMEOUT_MS = 12000

// ⚡ Todas las APIs en paralelo
const tryDownloadParallel = async (videoUrl) => {
  const apis = [
    { name: "MayAPI", url: `https://mayapi.ooguy.com/ytdl?url=${encodeURIComponent(videoUrl)}&type=mp4&apikey=may-0595dca2` },
    { name: "AdonixAPI", url: `https://api-adonix.ultraplus.click/download/ytmp4?apikey=AdonixKeyz11c2f6197&url=${encodeURIComponent(videoUrl)}` },
    { name: "Adofreekey", url: `https://api-adonix.ultraplus.click/download/ytmp4?apikey=Adofreekey&url=${encodeURIComponent(videoUrl)}` }
  ]

  const tasks = apis.map(api =>
    axios.get(api.url, { timeout: TIMEOUT_MS })
      .then(r => {
        const link = r.data?.result?.url || r.data?.data?.url
        if (r.data?.status && link) {
          return { url: link, api: api.name }
        }
        throw new Error(`${api.name}: sin link válido`)
      })
  )

  return Promise.any(tasks) // gana el primero válido
}

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

  let winner
  try {
    winner = await tryDownloadParallel(videoUrl)
  } catch (err) {
    return conn.sendMessage(msg.key.remoteJid, { text: `⚠️ Todas las APIs fallaron\n\n${err.message}` }, { quoted: msg })
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

  // 🚀 Dos métodos de envío en paralelo
  const sendDirect = async () => {
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
    return "direct"
  }

  const sendFromTmp = async () => {
    const tmp = path.join(process.cwd(), "tmp")
    if (!fs.existsSync(tmp)) fs.mkdirSync(tmp)
    const file = path.join(tmp, `${Date.now()}_vid.mp4`)

    const controller = new AbortController()
    const dl = await axios.get(videoDownloadUrl, { responseType: "stream", signal: controller.signal, timeout: 0 })
    let totalSize = 0
    dl.data.on("data", chunk => {
      totalSize += chunk.length
      if (totalSize > MAX_FILE_SIZE) dl.data.destroy()
    })

    await streamPipe(dl.data, fs.createWriteStream(file))

    const stats = fs.statSync(file)
    if (stats.size > MAX_FILE_SIZE) {
      fs.unlinkSync(file)
      throw new Error("⚠️ El archivo excede el límite de 60 MB")
    }

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
    return "tmp"
  }

  try {
    const winnerMethod = await Promise.any([sendDirect(), sendFromTmp()])
    console.log("✅ Ganó el método:", winnerMethod)
    await conn.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } })
  } catch (e) {
    console.error(e)
    await conn.sendMessage(msg.key.remoteJid, { text: `⚠️ Error al enviar el video:\n\n${e.message}` }, { quoted: msg })
  }
}

handler.command = ["play2"]
export default handler