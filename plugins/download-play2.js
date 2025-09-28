import axios from "axios"
import yts from "yt-search"

const MAX_FILE_SIZE_MB = 75

const tryApi = (apiName, urlBuilder, timeoutMs = 15000) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  return axios.get(urlBuilder(), { signal: controller.signal })
    .then(r => {
      clearTimeout(timeout)
      const link = r.data?.result?.url || r.data?.data?.url
      if (!link) throw new Error(`${apiName}: No entregó URL válido`)
      return { url: link, api: apiName }
    })
    .catch(err => {
      clearTimeout(timeout)
      throw new Error(`${apiName}: ${err.message}`)
    })
}

const checkSize = async (url, maxMB = MAX_FILE_SIZE_MB) => {
  try {
    const res = await axios.head(url, { timeout: 10000 })
    const size = parseInt(res.headers["content-length"] || "0", 10)
    return size > 0 && size <= maxMB * 1024 * 1024
  } catch {
    return true
  }
}

const apisList = (videoUrl) => [
  () => tryApi("Api 1M", () => `https://mayapi.ooguy.com/ytdl?url=${encodeURIComponent(videoUrl)}&type=mp4&quality=360&apikey=may-0595dca2`),
  () => tryApi("Api 2A", () => `https://api-adonix.ultraplus.click/download/ytmp4?apikey=AdonixKeyz11c2f6197&url=${encodeURIComponent(videoUrl)}&quality=360`),
  () => tryApi("Api 3F", () => `https://api-adonix.ultraplus.click/download/ytmp4?apikey=Adofreekey&url=${encodeURIComponent(videoUrl)}&quality=360`),
  () => tryApi("Api 4MY", () => `https://api-adonix.ultraplus.click/download/ytmp4?apikey=SoyMaycol<3&url=${encodeURIComponent(videoUrl)}&quality=360`),
  () => tryApi("Api 5K", () => `https://api-adonix.ultraplus.click/download/ytmp4?apikey=Angelkk122&url=${encodeURIComponent(videoUrl)}&quality=360`)
]

const firstSuccessfulApi = async (videoUrl, attempts = 3) => {
  for (let i = 0; i < attempts; i++) {
    try {
      const winner = await Promise.any(
        apisList(videoUrl).map(api => api())
      )
      return winner
    } catch {}
  }
  throw new Error(`⚠️ Todas las APIs fallaron tras ${attempts} intentos`)
}

const handler = async (msg, { conn, text }) => {
  if (!text?.trim())
    return conn.sendMessage(msg.key.remoteJid, { text: "🎬 Ingresa el nombre de algún video" }, { quoted: msg })

  await conn.sendMessage(msg.key.remoteJid, { react: { text: "🕒", key: msg.key } })

  const search = await yts({ query: text, hl: "es", gl: "MX" })
  const video = search.videos[0]
  if (!video)
    return conn.sendMessage(msg.key.remoteJid, { text: "❌ No encontré resultados." }, { quoted: msg })

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

  const sizeOk = await checkSize(videoDownloadUrl)
  if (!sizeOk)
    return conn.sendMessage(msg.key.remoteJid, { text: "⚠️ El archivo excede el límite permitido por WhatsApp." }, { quoted: msg })

  try {
    await conn.sendMessage(
      msg.key.remoteJid,
      {
        video: { url: videoDownloadUrl },
        mimetype: "video/mp4",
        fileName: `${title}.mp4`,
        caption: `
> 𝚅𝙸𝙳𝙴𝙾 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁

⭒ 🎵 𝚃𝚒́𝚝𝚞𝚕𝚘: ${title}
⭒ 🎤 𝙰𝚛𝚝𝚒𝚜𝚝𝚊: ${artista}
⭒ 🕑 𝙳𝚞𝚛𝚊𝚌𝚒ó𝚗: ${duration}
⭒ 🌐 𝙰𝚙𝚒: ${apiUsada}

» 𝙑𝙸𝘿𝙴𝙾 𝙴𝙽𝙑𝙸𝘼𝘿𝙾 🎧
`.trim(),
        supportsStreaming: true
      },
      { quoted: msg }
    )
    await conn.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } })
  } catch (e) {
    await conn.sendMessage(msg.key.remoteJid, { text: `⚠️ Error al enviar el video:\n\n${e.message}` }, { quoted: msg })
  }
}

handler.command = ["play2"]
export default handler