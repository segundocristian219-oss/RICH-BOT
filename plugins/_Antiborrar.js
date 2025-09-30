import fetch from 'node-fetch'
import yts from 'yt-search'
import ytdl from 'ytdl-core'
import axios from 'axios'
import { ogmp3 } from '../lib/youtubedl.js'

const LimitAud = 725 * 1024 * 1024 // 725MB
const LimitVid = 425 * 1024 * 1024 // 425MB
let tempStorage = {}

const handler = async (m, {conn, command, args, text, usedPrefix}) => {
    if (!text) return conn.reply(m.chat, `❌ Uso incorrecto\n*${usedPrefix + command} Billie Eilish - Bellyache*`, m)

    const yt_play = await search(args.join(' '))
    const texto1 = `⌘━─━─≪ *YOUTUBE* ≫─━─━⌘
★ Título:
★ ${yt_play[0].title}
★ Subido:
★ ${yt_play[0].ago}
★ Duración:
★ ${secondString(yt_play[0].duration.seconds)}
★ Vistas:
★ ${MilesNumber(yt_play[0].views)}
★ Autor:
★ ${yt_play[0].author.name}
★ URL:
★ ${yt_play[0].url.replace(/^https?:\/\//, '')}
⌘━━─≪ Descargas ≫─━━⌘
`.trim()

    tempStorage[m.sender] = {url: yt_play[0].url, title: yt_play[0].title}

    await conn.sendMessage(
        m.chat,
        {image: {url: yt_play[0].thumbnail}, caption: texto1, viewOnce: true},
        {quoted: m}
    )
}

// ====== handler.before ======
handler.before = async (m, {conn}) => {
    const text = m.text.trim().toLowerCase()
    if (!['🎶', 'audio', '📽', 'video'].includes(text)) return

    const userVideoData = tempStorage[m.sender]
    if (!userVideoData || !userVideoData.url) return

    const [input, qualityInput = text === '🎶' || text === 'audio' ? '320' : '720'] = userVideoData.title.split(' ')
    const audioQualities = ['64', '96', '128', '192', '256', '320']
    const videoQualities = ['240', '360', '480', '720', '1080']
    const isAudio = text === '🎶' || text === 'audio'
    const selectedQuality = (isAudio ? audioQualities : videoQualities).includes(qualityInput) ? qualityInput : isAudio ? '320' : '720'

    const audioApis = [
        {url: () => ogmp3.download(userVideoData.url, selectedQuality, 'audio'), extract: (data) => ({data: data.result.download, isDirect: false})},
        {url: () => ytMp3(userVideoData.url), extract: (data) => ({data, isDirect: true})},
        {
            url: () => fetch(`https://api.neoxr.eu/api/youtube?url=${userVideoData.url}&type=audio&quality=128kbps&apikey=GataDios`).then(res => res.json()),
            extract: (data) => ({data: data.data.url, isDirect: false})
        }
    ]

    const videoApis = [
        {url: () => ogmp3.download(userVideoData.url, selectedQuality, 'video'), extract: (data) => ({data: data.result.download, isDirect: false})},
        {url: () => ytMp4(userVideoData.url), extract: (data) => ({data, isDirect: false})},
        {
            url: () => fetch(`https://api.neoxr.eu/api/youtube?url=${userVideoData.url}&type=video&quality=720p&apikey=GataDios`).then(res => res.json()),
            extract: (data) => ({data: data.data.url, isDirect: false})
        }
    ]

    const download = async (apis) => {
        let mediaData = null
        let isDirect = false
        for (const api of apis) {
            try {
                const data = await api.url()
                const {data: extractedData, isDirect: direct} = api.extract(data)
                if (extractedData) {
                    const size = await getFileSize(extractedData)
                    if (size >= 1024) {
                        mediaData = extractedData
                        isDirect = direct
                        break
                    }
                }
            } catch (e) {
                console.log(`Error con API: ${e}`)
                continue
            }
        }
        return {mediaData, isDirect}
    }

    try {
        if (isAudio) {
            await conn.reply(m.chat, '🎵 Descargando audio...', m)
            const {mediaData, isDirect} = await download(audioApis)
            if (mediaData) {
                const fileSize = await getFileSize(mediaData)
                if (fileSize > LimitAud) {
                    await conn.sendMessage(
                        m.chat,
                        {document: isDirect ? mediaData : {url: mediaData}, mimetype: 'audio/mpeg', fileName: `${userVideoData.title}.mp3`},
                        {quoted: m}
                    )
                } else {
                    await conn.sendMessage(m.chat, {audio: isDirect ? mediaData : {url: mediaData}, mimetype: 'audio/mpeg'}, {quoted: m})
                }
            } else {
                await conn.reply(m.chat, '❌ No se pudo descargar el audio', m)
            }
        } else {
            await conn.reply(m.chat, '🎬 Descargando video...', m)
            const {mediaData, isDirect} = await download(videoApis)
            if (mediaData) {
                const fileSize = await getFileSize(mediaData)
                const messageOptions = {fileName: `${userVideoData.title}.mp4`, caption: `⟡ *${userVideoData.title}*`, mimetype: 'video/mp4'}
                if (fileSize > LimitVid) {
                    await conn.sendMessage(m.chat, {document: isDirect ? mediaData : {url: mediaData}, ...messageOptions}, {quoted: m})
                } else {
                    await conn.sendMessage(m.chat, {video: isDirect ? mediaData : {url: mediaData}, ...messageOptions}, {quoted: m})
                }
            } else {
                await conn.reply(m.chat, '❌ No se pudo descargar el video', m)
            }
        }
    } catch (error) {
        console.error(error)
    } finally {
        delete tempStorage[m.sender]
    }
}

handler.command = /^(play|play2)$/i
export default handler

// ====== FUNCIONES AUXILIARES ======
async function search(query, options = {}) {
    const search = await yts.search({query, hl: 'es', gl: 'ES', ...options})
    return search.videos
}

function MilesNumber(number) {
    const exp = /(\d)(?=(\d{3})+(?!\d))/g
    const rep = '$1.'
    const arr = number.toString().split('.')
    arr[0] = arr[0].replace(exp, rep)
    return arr[1] ? arr.join('.') : arr[0]
}

function secondString(seconds) {
    seconds = Number(seconds)
    const d = Math.floor(seconds / (3600 * 24))
    const h = Math.floor((seconds % (3600 * 24)) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    const dDisplay = d > 0 ? d + (d == 1 ? ' día, ' : ' días, ') : ''
    const hDisplay = h > 0 ? h + (h == 1 ? ' hora, ' : ' horas, ') : ''
    const mDisplay = m > 0 ? m + (m == 1 ? ' minuto, ' : ' minutos, ') : ''
    const sDisplay = s > 0 ? s + (s == 1 ? ' segundo' : ' segundos') : ''
    return dDisplay + hDisplay + mDisplay + sDisplay
}

async function getFileSize(url) {
    try {
        const response = await fetch(url, {method: 'HEAD'})
        return parseInt(response.headers.get('content-length') || 0)
    } catch {
        return 0
    }
}