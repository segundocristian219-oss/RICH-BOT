import fetch from 'node-fetch'

const geminiSessions = {}

const gemini = {
  getNewCookie: async () => {
    const res = await fetch(
      "https://gemini.google.com/_/BardChatUi/data/batchexecute?rpcids=maGuAc&source-path=%2F&bl=boq_assistant-bard-web-server_20250814.06_p1&f.sid=-7816331052118000090&hl=en-US&_reqid=173780&rt=c",
      {
        headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: "f.req=%5B%5B%5B%22maGuAc%22%2C%22%5B0%5D%22%2Cnull%2C%22generic%22%5D%5D%5D&",
        method: "POST",
      }
    )
    const cookieHeader = res.headers.get("set-cookie")
    if (!cookieHeader) throw new Error('No se encontró el encabezado "set-cookie".')
    return cookieHeader.split(';')[0]
  },

  ask: async (prompt, previousId = null) => {
    if (typeof prompt !== 'string' || !prompt.trim().length)
      throw new Error('❌ Debes escribir un mensaje válido.')

    let resumeArray = null
    let cookie = null

    if (previousId) {
      try {
        const s = Buffer.from(previousId, 'base64').toString('utf-8')
        const j = JSON.parse(s)
        resumeArray = j.newResumeArray
        cookie = j.cookie
      } catch {}
    }

    const headers = {
      'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'x-goog-ext-525001261-jspb':
        '[1,null,null,null,"9ec249fc9ad08861",null,null,null,[4]]',
      cookie: cookie || (await gemini.getNewCookie()),
    }

    const b = [[prompt], ['es-ES'], resumeArray]
    const a = [null, JSON.stringify(b)]
    const body = new URLSearchParams({ 'f.req': JSON.stringify(a) })

    const response = await fetch(
      'https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?bl=boq_assistant-bard-web-server_20250729.06_p0&f.sid=4206607810970164620&hl=es-ES&_reqid=2813378&rt=c',
      { headers, body, method: 'POST' }
    )

    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)

    const data = await response.text()
    const match = data.matchAll(/^\d+\n(.+?)\n/gm)
    const chunks = Array.from(match, (m) => m[1])

    for (const chunk of chunks.reverse()) {
      try {
        const realArray = JSON.parse(chunk)
        const parse1 = JSON.parse(realArray[0][2])
        if (
          parse1?.[4]?.[0]?.[1]?.[0] &&
          typeof parse1[4][0][1][0] === 'string'
        ) {
          const text = parse1[4][0][1][0].replace(/\*\*(.+?)\*\*/g, '*$1*')
          const newResumeArray = [...parse1[1], parse1[4][0][0]]
          const id = Buffer.from(
            JSON.stringify({ newResumeArray, cookie: headers.cookie })
          ).toString('base64')
          return { text, id }
        }
      } catch {}
    }

    throw new Error('❌ No se pudo procesar la respuesta.')
  },
}

// 🔥 Handler real para DS6 Meta
const handler = async (m, { conn }) => {
  try {
    const botJid = conn.user?.id?.split(':')[0] + '@s.whatsapp.net'
    const mentioned = m?.message?.extendedTextMessage?.contextInfo?.mentionedJid || []

    // Solo continuar si el bot fue mencionado
    if (!mentioned.includes(botJid)) return

    const text =
      m?.message?.extendedTextMessage?.text ||
      m?.message?.conversation ||
      ''
    const cleanText = text.replace(/@\S+/g, '').trim()
    if (!cleanText) return

    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

    const previousId = geminiSessions[m.sender]
    const result = await gemini.ask(cleanText, previousId)
    geminiSessions[m.sender] = result.id

    const name = m.pushName || 'Usuario'
    const reply = `╭━〔 *RESPUESTA IA* 〕━⬣
│ ✦ Pregunta: ${cleanText}
│ ✦ Usuario: ${name}
╰━━━━━━━━━━━━⬣

${result.text}

╭━〔 FUENTE 〕━⬣
│ ✦ Powered by Gemini AI
╰━━━━━━━━━━━━⬣`

    await conn.sendMessage(
      m.chat,
      { text: reply, mentions: [m.sender] },
      { quoted: m }
    )
    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
  } catch (e) {
    console.error(e)
    await conn.sendMessage(m.chat, { text: `❌ Error: ${e.message}` }, { quoted: m })
  }
}

// ⚙️ Configuración del plugin DS6 Meta
handler.help = ['mención']
handler.tags = ['ai']
handler.command = /^(mencion)$/i // no importa, no se usa comando
handler.limit = false
handler.register = false

export default handler