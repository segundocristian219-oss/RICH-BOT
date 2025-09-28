import axios from "axios"
import yts from "yt-search"

const MAX_FILE_SIZE = 70 * 1024 * 1024 // 70 MB

// Verificar tamaño antes de enviar
const checkSize = async (url, maxMB = 70) => {
  try {
    const res = await axios.head(url, { timeout: 10000 })
    const size = parseInt(res.headers["content-length"] || "0", 10)
    return size > 0 && size <= maxMB * 1024 * 1024
  } catch {
    return true // si no hay content-length, intentamos igual
  }
}

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
  if (!text?.trim())
    return conn.sendMessage(
      msg.key.remoteJid,
      { text: "🎬 Ingresa el nombre de algún video" },
      { quoted: msg }
    )

  await conn.sendMessage(msg.key.remoteJid, { react: { text: "🕒", key: msg.key } })

  // Buscar en YouTube
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

  try {
    // Elegir la API más rápida
    const winner = await Promise.any(apis.map(api => api()))
    const videoDownloadUrl = winner.url
    const apiUsada = winner.api

    // Verificar tamaño antes de enviar
    if (!(await checkSize(videoDownloadUrl))) {
      throw new Error("⚠️ El archivo excede el límite de 70 MB permitido por WhatsApp.")
    }

    // Enviar directo desde la URL (más rápido que descargarlo primero)
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

» 𝙑𝙸𝘿𝙀𝙊 𝙀𝙉𝙑𝙸𝘼𝘿𝙾  🎧
» 𝘿𝙄𝙎𝙁𝙍𝙐𝙏𝘼𝙇𝙊 𝘾𝘼𝙈𝙋𝙀𝙊𝙉..

⇆‌ ㅤ◁ㅤㅤ❚❚ㅤㅤ▷ㅤ↻
        `.trim(),
        supportsStreaming: true
      },
      { quoted: msg }
    )

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