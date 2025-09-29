import axios from "axios"
import yts from "yt-search"
import fs from "fs"
import path from "path"
import { promisify } from "util"
import { pipeline } from "stream"

const streamPipe = promisify(pipeline)

const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text?.trim()) {
    return conn.reply(m.chat, `❀ Envía el nombre o link del vídeo.`, m)
  }

  await m.react("🕒")

  try {
    // 🔎 Buscar video si no es URL
    let videoUrl = text
    if (!/^https?:\/\//.test(text)) {
      const search = await yts(text)
      if (!search.videos.length) throw "No se encontraron resultados"
      videoUrl = search.videos[0].url
    }

    // ⚡ APIs en paralelo → el primer link válido gana
    const tryApi = (name, fn) => fn().catch(() => { throw new Error(name + " falló") })
    const apiPromises = [
      tryApi("MayAPI", async () => `https://mayapi.ooguy.com/ytdl?url=${encodeURIComponent(videoUrl)}&type=mp4&quality=360&apikey=may-0595dca2`),
      tryApi("Adonix", async () => `https://api-adonix.ultraplus.click/download/ytmp4?apikey=AdonixKeyz11c2f6197&url=${encodeURIComponent(videoUrl)}`),
      tryApi("Desco", async () => `https://descoapi.fun/api/ytdl?apikey=DescoZ&url=${encodeURIComponent(videoUrl)}`),
      tryApi("OmgAPI", async () => `https://www.omgvideos-api.site/download?url=${encodeURIComponent(videoUrl)}&apikey=omg-73c16ec`),
    ]

    const videoDownloadUrl = await Promise.any(apiPromises)

    // 🏎️ Carrera directo vs tmp
    let yaEnviado = false
    const controller = new AbortController()
    const caption = `✅ Descargado con éxito`

    const sendDirect = async () => {
      try {
        await conn.sendMessage(m.chat, {
          video: { url: videoDownloadUrl },
          mimetype: "video/mp4",
          caption
        }, { quoted: m })
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
        const file = path.join("tmp", `${Date.now()}.mp4`)
        const dl = await axios.get(videoDownloadUrl, { responseType: "stream", signal: controller.signal })
        await streamPipe(dl.data, fs.createWriteStream(file))

        if (!yaEnviado) {
          yaEnviado = true
          await conn.sendMessage(m.chat, {
            video: fs.readFileSync(file),
            mimetype: "video/mp4",
            caption
          }, { quoted: m })
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

    await Promise.any([sendDirect(), sendFromTmp()])

    await m.react("✅")
  } catch (e) {
    console.error(e)
    await m.react("❌")
    conn.reply(m.chat, "⚠️ Error al descargar el video", m)
  }
}

handler.help = ["play2"]
handler.tags = ["downloader"]
handler.command = /^play2$/i

export default handler