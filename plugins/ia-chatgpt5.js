import fetch from "node-fetch";

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return conn.reply(m.chat, `🔥 ¡Hola! ¿cómo puedo ayudarte hoy?`, m);
  }

  const res = await fetch('https://files.catbox.moe/j65sl7.jpg');
  const thumb2 = Buffer.from(await res.arrayBuffer());

  const fkontak = {
    key: { participants: "0@s.whatsapp.net", remoteJid: "status@broadcast", fromMe: false, id: "Halo" },
    message: {
      locationMessage: {
        name: `🤖 𝗖𝗛𝗔𝗧𝗚𝗣𝗧-𝟱 𝗙𝗥𝗢𝗠 𝗠𝗔𝗬𝗔𝗣𝗜`,
        jpegThumbnail: thumb2
      }
    },
    participant: "0@s.whatsapp.net"
  };

  try {
    const apiUrl = `https://mayapi.ooguy.com/gpt5?apikey=may-0595dca2&q=${encodeURIComponent(text)}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data || !data.result) {
      return conn.reply(m.chat, "❌ No recibí respuesta de la IA, intenta de nuevo.", m);
    }

    await conn.reply(m.chat, `${data.result}`, fkontak);
  } catch (e) {
    console.error(e);
    await conn.reply(m.chat, "⚠️ Hubo un error al conectar con la IA.", m);
  }
};

handler.tags = ["ai"];
handler.command = ["gpt5", "chatgpt5"];

export default handler;