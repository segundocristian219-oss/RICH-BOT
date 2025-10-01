import axios from 'axios';
import { Buffer } from 'buffer';

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

let handler = async (msg, { conn, args, command }) => {
  const chatId = msg.key.remoteJid;
  const text = args.join(" ");

  if (!text) {
    return conn.sendMessage(chatId, {
      text: `⚠️ *Uso:* ${command} <texto>`,
    }, { quoted: msg });
  }

  try {
    if (msg?.key?.id) await conn.sendMessage(chatId, { react: { text: "🎤", key: msg.key } });

    // Llamada a la API de Yau
    const res = await axios.get("https://www.mayapi.ooguy.com/ai-venice", {
      params: { q: text, apikey: "nevi" },
      responseType: 'arraybuffer' // para recibir audio directo
    });

    if (!res.data) throw new Error('No pude obtener audio de la API');

    const bufferAudio = Buffer.from(res.data, 'binary');

    await conn.sendMessage(chatId, {
      audio: bufferAudio,
      mimetype: 'audio/mpeg',
      ptt: true
    }, { quoted: msg.key ? msg : null });

    if (msg?.key?.id) await conn.sendMessage(chatId, { react: { text: "✅", key: msg.key } });

  } catch (e) {
    console.error("❌ Error en comando AI voz:", e);

    if (msg?.key?.id) await conn.sendMessage(chatId, { react: { text: "❌", key: msg.key } });

    await conn.sendMessage(chatId, {
      text: "❌ Ocurrió un error al generar la voz, intentalo otra vez",
    }, { quoted: msg });
  }
};

handler.command = ['iavoz'];
handler.tags = ['ia'];
handler.help = ['iavoz <texto>'];

export default handler;