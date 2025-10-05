import hispamemes from "hispamemes";
import axios from "axios";

let memeIndex = 0; // Para rotar entre las 3 fuentes

const handler = async (msg, { conn }) => {
  const chatId = msg.key.remoteJid;

  try {
    let memeUrl;
    let sourceName;

    // Elegir la fuente según el índice
    switch (memeIndex % 3) {
      case 0: // hispamemes
        sourceName = "hispamemes";
        memeUrl = hispamemes.meme();
        break;
      case 1: // kirito API
        sourceName = "Kirito API";
        {
          const res = await axios.get("https://api.kirito.my/api/meme?apikey=by_deylin");
          memeUrl = res.data.url || res.data.result?.url;
        }
        break;
      case 2: // g-mini IA
        sourceName = "G-Mini IA";
        {
          const res = await axios.get("https://g-mini-ia.vercel.app/api/meme");
          memeUrl = res.data.url || res.data.result?.url;
        }
        break;
    }

    memeIndex++;

    // Enviar reacción
    await conn.sendMessage(chatId, {
      react: { text: "😆", key: msg.key }
    });

    // Enviar meme
    await conn.sendMessage(chatId, {
      image: { url: memeUrl },
      caption: "🤣 *¡Aquí tienes un meme del día!*"
    }, { quoted: msg });

  } catch (e) {
    console.error("❌ Error en el comando meme:", e);

    await conn.sendMessage(chatId, {
      text: `❌ *Ocurrió un error al obtener el meme.*\nFuente: *${["hispamemes","Kirito API","G-Mini IA"][memeIndex % 3]}*\nError: \`${e.message || e}\``
    }, { quoted: msg });
  }
};

handler.command = ["meme", "memes"];
export default handler;