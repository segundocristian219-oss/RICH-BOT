import fetch from "node-fetch"
import yts from "yt-search"

const youtubeRegexID = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/

const handler = async (m, { conn, text, command }) => {
  try {
    if (!text?.trim()) {
      return conn.reply(m.chat, "✦ Por favor, escribe el nombre o el enlace del video que deseas buscar.", m)
    }

    await conn.sendMessage(m.chat, { react: { text: "🔎", key: m.key } }) // buscando

    const videoIdMatch = text.match(youtubeRegexID)
    const searchQuery = videoIdMatch ? `https://youtu.be/${videoIdMatch[1]}` : text

    const searchResults = await yts(searchQuery)
    let video = null

    if (videoIdMatch) {
      const id = videoIdMatch[1]
      video = searchResults.all.find(v => v.videoId === id) || searchResults.videos.find(v => v.videoId === id)
    }

    if (!video) video = searchResults.videos?.[0] || null
    if (!video) {
      await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } })
      return m.reply("✧ No se encontraron resultados para tu búsqueda.")
    }

    const { title, thumbnail, timestamp, views, ago, url, author } = video
    const canal = author?.name || "Desconocido"
    const vistas = formatViews(views || 0)

    const infoMessage = `> *_${title}_*
✩ *Duración*: ${timestamp || "no disponible"}
✩ *Visitas*: ${vistas}
✩ *Autor*: ${canal}
✩ *Publicado*: ${ago || "no disponible"}
✩ *Url*: ${url}`

    const thumb = (await conn.getFile(thumbnail))?.data

    const preview = {
      contextInfo: {
        externalAdReply: {
          title: '',
          body: botname,
          mediaType: 1,
          previewType: 0,
          mediaUrl: url,
          sourceUrl: url,
          thumbnail: thumb,
          renderLargerThumbnail: true,
        },
      },
    }

    await conn.reply(m.chat, infoMessage, m, preview)

    const isVideo = ['play2', 'ytv', 'ytmp4', 'mp4'].includes(command)
    if (!isVideo) {
      await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } })
      return conn.reply(m.chat, "✦ Comando no reconocido. Usa un comando válido para descargar video.", m)
    }

    await conn.sendMessage(m.chat, { react: { text: "🕒", key: m.key } }) // descargando

    const tryApi = async (apiName, apiUrl) => {
      const res = await fetch(apiUrl)
      const json = await res.json()
      if (!json.status || !json.data?.url) {
        throw new Error(`${apiName}: ${json.message || "sin enlace válido"}`)
      }
      return { url: json.data.url, api: apiName }
    }

    const apis = [
      tryApi("MyAPI", `https://mayapi.ooguy.com/ytdl?url=${encodeURIComponent(url)}&type=mp4&apikey=may-0595dca2`),
      tryApi("Adonix", `https://myapiadonix.casacam.net/download/yt?apikey=Adofreekey&url=${encodeURIComponent(url)}&format=video`)
    ]

    const winner = await Promise.any(apis)
    const downloadUrl = winner.url

    await conn.sendMessage(m.chat, {
      video: { url: downloadUrl },
      mimetype: 'video/mp4',
      fileName: `${title}.mp4`,
      caption: `> *_✦ Descarga completa (${winner.api}). Aquí tienes tu video._*`
    }, { quoted: m })

    await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } }) // éxito

  } catch (error) {
    console.error('[ERROR YOUTUBE]', error)
    await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } })
    return m.reply(`⚠︎ Se produjo un error al procesar tu solicitud:\n\n${error.message || error}`)
  }
}

handler.command = handler.help = [
  'play2', 'ytv', 'ytmp4', 'mp4'
]

handler.tags = ['descargas']
//handler.group = true

export default handler

function formatViews(views) {
  if (!views) return "0"
  if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)}B (${views.toLocaleString()})`
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M (${views.toLocaleString()})`
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}k (${views.toLocaleString()})`
  return views.toString()
}