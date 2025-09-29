import axios from "axios"
import yts from "yt-search"
import fs from "fs"
import path from "path"
import { promisify } from "util"
import { pipeline } from "stream"

const streamPipe = promisify(pipeline)
const MAX_FILE_SIZE = 60 * 1024 * 1024

const handler = async (m, { conn, text }) => {
  if (!text?.trim()) {
    return conn.sendMessage(m.chat, { text: "🎬 Ingresa el nombre de algún video" }, { quoted: m })
  }

  await m.react("🕒")

  try {
    // 🔎 Buscar video si no es URL
    let videoUrl = text
    let title = "Video"
    let duration = "Desconocida"
    let artista = "Desconocido"

    if (!/^https?:\/\//.test(text)) {
      const search = await yts(text)
      if (!search.videos.length) throw new Error("❌ Sin resultados")
      const video = search.videos[0]
      videoUrl = video.url
      title = video.title
      duration = video.timestamp
      artista = video.author?.name || "Desconocido"
    }

    // ⚡ Solo MyAPI
    const apiUrl = `https://mayapi.ooguy.com/ytdl?url=${encodeURIComponent(videoUrl)}&type=mp4&quality=360&apikey=may-0595dca2`
    const res = await axios.get(apiUrl, { timeout: 15000 })
    const link = res.data?.result?.url || res.data?.data?.url
    if (!res.data?.status || !link) throw new Error("MyAPI falló")
    let videoDownloadUrl = link
    const apiUsada = "MyAPI"

    // ⚠️ Validar que sea mp4
    const head = await axios.head(videoDownloadUrl).catch(() => null)
    if (!head || !/^video\//.test(head.headers["content-type"] || "")) {
      throw new Error("El link devuelto no es un mp4 válido")
    }

    const caption = `
> 𝚅𝙸𝙳𝙴𝙾 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁

⭒ 🎵 𝚃𝚒́𝚝𝚞𝚕𝚘: ${title}
⭒ 🎤 𝙰𝚛𝚝𝚒𝚜𝚝𝚊: ${artista}
⭒ 🕑 𝙳𝚞𝚛𝚊𝚌𝚒ó𝚗: ${duration}
⭒ 🌐 𝙰𝚙𝚒: ${apiUsada}

» 𝙑𝙸𝘿𝙴𝙊 𝙀𝙽𝙑𝙸𝘼𝘿𝙊 🎧
⇆‌ ㅤ◁ㅤ❚❚ㅤ▷ㅤ↻
`.trim()

    // 🏎️ Carrera directo vs tmp
    let yaEnviado = false
    const controller = new AbortController()

    const sendDirect = async () => {
      try {
        await conn.sendMessage(
          m.chat,
          { video: { url: videoDownloadUrl }, mimetype: "video/mp4", caption },
          { quoted: m }
        )
        if (!yaEnviado) {
          yaEnviado = true
          controller.abort() // cancela tmp
          return "direct"
        }
        return null
      } catch {
        throw new Error("falló directo")
      }
    }

    const sendFromTmp = async () => {
      try {
        const tmpDir = path.join(process.cwd(), "tmp")
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir)
        const file = path.join(tmpDir, `${Date.now()}_vid.mp4`)

        const dl = await axios.get(videoDownloadUrl, {
          responseType: "stream",
          signal: controller.signal,
          timeout: 0
        })

        let totalSize = 0
        dl.data.on("data", chunk => {
          totalSize += chunk.length
          if (totalSize > MAX_FILE_SIZE) dl.data.destroy()
        })

        await streamPipe(dl.data, fs.createWriteStream(file))

        if (!yaEnviado) {
          yaEnviado = true
          await conn.sendMessage(
            m.chat,
            { video: fs.readFileSync(file), mimetype: "video/mp4", caption },
            { quoted: m }
          )
        }

        fs.unlinkSync(file)
        return "tmp"
      } catch (e) {
        if (e.name === "CanceledError") {
          console.log("Descarga tmp cancelada 🚫")
        } else {
          throw new Error("falló tmp")
        }
      }
    }

    const winnerMethod = await Promise.any([sendDirect(), sendFromTmp()])
    console.log("✅ Ganó el método:", winnerMethod)
    await m.react("✅")

  } catch (e) {
    console.error(e)
    await m.react("❌")
    conn.sendMessage(m.chat, { text: `⚠️ Error al descargar el video:\n\n${e.message}` }, { quoted: m })
  }
}

handler.command = ["play2"]
export default handler