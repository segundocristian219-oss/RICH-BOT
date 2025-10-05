import hispamemes from "hispamemes";
import axios from "axios";
import fs from "fs";
import path from "path";

const indexFile = path.join("./memeIndex.json");

let memeIndex = 0;

if (fs.existsSync(indexFile)) {
  try {
    const data = JSON.parse(fs.readFileSync(indexFile, "utf-8"));
    memeIndex = data.memeIndex || 0;
  } catch {
    memeIndex = 0;
  }
}

const saveIndex = () => {
  fs.writeFileSync(indexFile, JSON.stringify({ memeIndex }));
};

const sources = [
  {
    name: "hispamemes",
    getUrl: () => {
      const url = hispamemes.meme();
      if (!url) throw new Error("No se obtuvo URL del meme");
      return url;
    }
  },
  {
    name: "Kirito API",
    getUrl: async () => {
      const res = await axios.get("https://api.kirito.my/api/meme?apikey=by_deylin");
      const url = res.data?.url || res.data?.result?.url;
      if (!url) throw new Error("Respuesta inválida de Kirito API");
      return url;
    }
  }
];

const handler = async (msg, { conn }) => {
  const chatId = msg.key.remoteJid;

  let tries = 0;
  let memeUrl, sourceName;

  while (tries < sources.length) {
    const source = sources[memeIndex % sources.length];
    sourceName = source.name;

    try {
      memeUrl = await source.getUrl();
      memeIndex++;
      saveIndex();
      break;
    } catch (e) {
      console.error(`❌ Error en ${sourceName}:`, e);
      memeIndex++;
      saveIndex();
      tries++;
      if (tries === sources.length) {
        return await conn.sendMessage(chatId, {
          text: `❌ *Ocurrió un error al obtener el meme.*\nTodas las fuentes fallaron.\nÚltimo error (${sourceName}): \`${e.message || e}\``
        }, { quoted: msg });
      }
    }
  }

  await conn.sendMessage(chatId, {
    react: { text: "😆", key: msg.key }
  });

  await conn.sendMessage(chatId, {
    image: { url: memeUrl },
    caption: "🤣 *¡Aquí tienes un meme del día!*"
  }, { quoted: msg });
};

handler.command = ["meme", "memes"];
export default handler;