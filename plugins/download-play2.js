import axios from "axios"
import yts from "yt-search"
import fs from "fs"
import path from "path"
import { promisify } from "util"
import { pipeline } from "stream"

const streamPipe = promisify(pipeline)
const MAX_FILE_SIZE = 60 * 1024 * 1024 // 60 MB máximo permitido por WhatsApp

const handler = async (msg, { conn, text }) => {
  if (!text || !text.trim()) {
    return conn.sendMessage(
      msg.key.remoteJid,
      { text: "🎬 Ingresa el nombre de algún video" },
      { quoted: msg }
    )
  }

  await conn.sendMessage(msg.key.remoteJid, { react: { text: "🕒", key: msg.key } })

  // 🔎 Buscar en YouTube
  const search = await yts({ query: text, hl: "es", gl: "MX" })
  const video = search.videos[0]
  if (!video) {
    return conn.sendMessage(
      msg.key.remoteJid,
      { text: "❌ Sin resultados." },
      { quoted: msg }
    )
  }

  const { url: videoUrl, title, timestamp: duration, author } = video
  const artista = author.name

  // 🔹 Intentar con las APIs
  const tryDownloadParallel = async () => {
    const apis = [
      { name: "MayAPI", url: `https://mayapi.ooguy.com/ytdl?url=${encodeURIComponent(videoUrl)}&type=mp4&apikey=may-0595dca2` },
      { name: "AdonixAPI", url: `https://api-adonix.ultraplus.click/download/ytmp4?apikey=AdonixKeyz11c2f6197&url=${encodeURIComponent(videoUrl)}` },
      { name: "Adofreekey", url: `https://api-adonix.ultraplus.click/download/ytmp4?apikey=Adofreekey&url=${encodeURIComponent(videoUrl)}` }
    ]

    const results = await Promise.allSettled(
      apis.map(api =>
        axios.get(api.url, { timeout: 10000 })
          .then(r => {
            const link = r.data?.result?.url || r.data?.data?.url
            if (r.data?.status && link) {
              return { url: link, api: api.name }
            }
            throw new Error("Sin link válido")
          })
      )
    )

    return results.filter(r => r.status === "fulfilled").map(r => r.value)
  }

  // 🔹 Descargar y enviar el video
  const downloadAndSend = async (url, api) => {
    const tmp = path.join(process.cwd(), "tmp")
    if (!fs.existsSync(tmp)) fs.mkdirSync(tmp)
    else {
      for (const f of fs.readdirSync(tmp)) {
        try { fs.unlinkSync(path.join(tmp, f)) } catch {}
      }
    }

    const file = path.join(tmp, `${Date.now()}_vid.mp4`)

    const dl = await axios.get(url, { responseType: "stream", timeout: 0 })
    let totalSize = 0
    dl.data.on("data", chunk => {
      totalSize += chunk.length
      if (totalSize > MAX_FILE_SIZE) {
        dl.data.destroy(new Error("El archivo excede el límite de 60 MB permitido por WhatsApp."))
      }
    })

    await streamPipe(dl.data, fs.createWriteStream(file))

    await conn.sendMessage(
      msg.key.remoteJid,
      {
        video: fs.createReadStream(file),
        mimetype: "video/mp4",
        fileName: `${title}.mp4`,
        caption: `
> 𝚅𝙸𝙳𝙴𝙾 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁

⭒ ִֶָ७ ꯭🎵 - 𝚃𝚒́𝚝𝚞𝚕𝚘: ${title}
⭒ ִֶָ७ ꯭🎤 - 𝙰𝚛𝚝𝚒𝚜𝚝𝚊: ${artista}
⭒ ִֶָ७ ꯭🕑 - 𝙳𝚞𝚛𝚊𝚌𝚒ó𝚗: ${duration}
⭒ ִֶָ७ ꯭🌐 - 𝙰𝚙𝚒: ${api}

» 𝙑𝙄𝘿𝙀𝙊 𝙀𝙉𝙑𝙄𝘼𝘿𝙊 🎧
» 𝘿𝙄𝙎𝙁𝙍𝙐𝙏𝘼𝙇𝙊 𝘾𝘼𝙈𝙋𝙀𝙊𝙉..

⇆‌ ㅤ◁ㅤㅤ❚❚ㅤㅤ▷ㅤ↻

> \`\`\`© 𝖯𝗈𝗐𝖾𝗋𝖾𝖽 𝖻𝗒 𝗁𝖾𝗋𝗇𝖺𝗇𝖽𝖾𝗓.𝗑𝗒𝗓\`\`\`
          `.trim(),
        supportsStreaming: true,
        contextInfo: { isHd: true }
      },
      { quoted: msg }
    )

    fs.unlinkSync(file)
  }

  try {
    const candidates = await tryDownloadParallel()
    if (candidates.length === 0) throw new Error("Ninguna API devolvió link válido")

    let success = false
    for (let i = 0; i < candidates.length; i++) {
      try {
        if (i > 0) {
          await conn.sendMessage(msg.key.remoteJid, { react: { text: "🏜️", key: msg.key } })
        }
        await downloadAndSend(candidates[i].url, candidates[i].api)
        success = true
        break
      } catch (err) {
        console.error(`Fallo con ${candidates[i].api}:`, err.message)
      }
    }

    if (!success) throw new Error("No se pudo descargar con ninguna API.")

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