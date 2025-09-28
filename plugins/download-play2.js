import axios from "axios";
import yts from "yt-search";
import https from "https";

const MAX_FILE_SIZE = 70 * 1024 * 1024; // 📦 70 MB máximo

const handler = async (msg, { conn, text }) => {
  if (!text || !text.trim()) {
    return conn.sendMessage(
      msg.key.remoteJid,
      { text: "🎬 Ingresa el nombre de algún video" },
      { quoted: msg }
    );
  }

  await conn.sendMessage(msg.key.remoteJid, { react: { text: "🕒", key: msg.key } });

  const res = await yts({ query: text, hl: "es", gl: "MX" });
  const video = res.videos[0];
  if (!video) {
    return conn.sendMessage(
      msg.key.remoteJid,
      { text: "❌ Sin resultados." },
      { quoted: msg }
    );
  }

  const { url: videoUrl, title, timestamp: duration, author } = video;
  const artista = author.name;

  const extractUrl = (data) => {
    const search = (obj) => {
      if (!obj) return null;
      if (typeof obj === "string" && obj.includes("http")) {
        if (/.(mp4|mkv|mov|webm)$/i.test(obj)) {
          return obj;
        }
      }
      if (typeof obj === "object") {
        for (const key in obj) {
          const found = search(obj[key]);
          if (found) return found;
        }
      }
      return null;
    };
    return search(data);
  };

  const tryApi = async (apiName, urlBuilder) => {
    try {
      const r = await axios.get(urlBuilder(), { timeout: 10000 });
      const vidUrl = extractUrl(r.data);
      if (vidUrl) return { url: vidUrl, api: apiName };
      throw new Error(`${apiName}: No entregó URL válido`);
    } catch (err) {
      throw new Error(`${apiName}: ${err.message}`);
    }
  };

  const apis = [
    () => tryApi("Api 1M", () => `https://mayapi.ooguy.com/ytdl?url=${encodeURIComponent(videoUrl)}&type=mp4&apikey=may-0595dca2`),
    () => tryApi("Api 2A", () => `https://api-adonix.ultraplus.click/download/ytmp4?apikey=AdonixKeyz11c2f6197&url=${encodeURIComponent(videoUrl)}`),
    () => tryApi("Api 3F", () => `https://api-adonix.ultraplus.click/download/ytmp4?apikey=Adofreekey&url=${encodeURIComponent(videoUrl)}`),
    () => tryApi("Api 4MY", () => `https://api-adonix.ultraplus.click/download/ytmp4?apikey=SoyMaycol<3&url=${encodeURIComponent(videoUrl)}`),
    () => tryApi("Api 5K", () => `https://api-adonix.ultraplus.click/download/ytmp4?apikey=Angelkk122&url=${encodeURIComponent(videoUrl)}`),
    () => tryApi("Api 6Srv", () => `http://173.208.192.170/download/ytmp4?apikey=Adofreekey&url=${encodeURIComponent(videoUrl)}`)
  ];

  const tryDownload = async () => {
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await Promise.any(apis.map(api => api()));
      } catch (err) {
        lastError = err;
        if (attempt < 3) {
          await conn.sendMessage(msg.key.remoteJid, { react: { text: "🔄", key: msg.key } });
        }
        if (attempt === 3) throw lastError;
      }
    }
  };

  try {
    const winner = await tryDownload();
    const videoDownloadUrl = winner.url;

    // ⚡ Descarga con límite en vivo
    const checkSizeAndSend = (url) => new Promise((resolve, reject) => {
      let downloaded = 0;
      const req = https.get(url, (resStream) => {
        if (resStream.headers["content-length"] && parseInt(resStream.headers["content-length"]) > MAX_FILE_SIZE) {
          req.destroy();
          return reject(new Error("El video excede el límite de 70 MB permitido por WhatsApp."));
        }

        resStream.on("data", (chunk) => {
          downloaded += chunk.length;
          if (downloaded > MAX_FILE_SIZE) {
            req.destroy();
            return reject(new Error("El video excede el límite de 70 MB permitido por WhatsApp."));
          }
        });

        resStream.on("end", () => resolve(url));
        resStream.on("error", (err) => reject(err));
      });

      req.on("error", (err) => reject(err));
    });

    await checkSizeAndSend(videoDownloadUrl);

    await conn.sendMessage(
      msg.key.remoteJid,
      {
        video: { url: videoDownloadUrl },
        mimetype: "video/mp4",
        fileName: `${title.slice(0, 50)}.mp4`.replace(/[^\w\s.-]/gi, ''),
        caption: `

> *𝚅𝙸𝙳𝙴𝙾 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*

⭒ ִֶָ७ ꯭🎵˙⋆｡ - *𝚃𝚒́𝚝𝚞𝚕𝚘:* ${title}
⭒ ִֶָ७ ꯭🎤˙⋆｡ - *𝙰𝚛𝚝𝚒𝚜𝚝𝚊:* ${artista}
⭒ ִֶָ७ ꯭🕑˙⋆｡ - *𝙳𝚞𝚛𝚊𝚌𝚒ó𝚗:* ${duration}
⭒ ִֶָ७ ꯭📺˙⋆｡ - *𝙲𝚊𝚕𝚒𝚍𝚊𝚍:* Auto
⭒ ִֶָ७ ꯭🌐˙⋆｡ - *𝙰𝚙𝚒:* ${winner.api}

» *𝘌𝘕𝘝𝘐𝘈𝘕𝘋𝘖 𝙑𝙄𝘿𝙀𝙊*  🎬
» *𝘿𝙄𝙎𝙁𝙍𝙐𝙏𝘼𝙇𝙊 𝘾𝘼𝙈𝙋𝙀𝙊𝙉*...

⇆‌ ㅤ◁ㅤㅤ❚❚ㅤㅤ▷ㅤ↻

> \`\`\`© 𝖯𝗈𝗐𝖾𝗋𝖾𝖽 𝖻𝗒 𝗁𝖾𝗋𝗇𝖺𝗇𝖽𝖾𝗓.𝗑𝗒𝗓\`\`\`
`.trim()
      },
      { quoted: msg }
    );

    await conn.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });

  } catch (e) {
    const errorMsg = typeof e === "string"
      ? e
      : `❌ *Error:* ${e.message || "Ocurrió un problema"}\n\n🔸 *Posibles soluciones:*\n• Verifica el nombre del video\n• Intenta con otro\n• Prueba más tarde`;

    await conn.sendMessage(msg.key.remoteJid, { text: errorMsg }, { quoted: msg });
  }
};

handler.command = ["play2"];
export default handler;