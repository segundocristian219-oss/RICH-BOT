import axios from "axios";
import yts from "yt-search";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { pipeline } from "stream";

const streamPipe = promisify(pipeline);
const MAX_FILE_SIZE = 60 * 1024 * 1024; // 60 MB
const MAX_DURATION = 10 * 60; // 10 min en segundos

// Probar una API
const tryApi = async (name, url) => {
  try {
    const res = await axios.get(url, { timeout: 12000 });
    const link = res.data?.result?.url || res.data?.data?.url;
    if (!link) throw new Error("No hay link válido");
    return { url: link, api: name };
  } catch (e) {
    throw new Error(`${name} falló: ${e.message}`);
  }
};

const handler = async (m, { conn, text }) => {
  try {
    if (!text?.trim())
      return conn.reply(m.chat, "🎬 Ingresa el nombre de algún video", m);

    await m.react("🕒");

    // Detectar si es link directo
    const videoMatch = text.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/
    );
    const query = videoMatch ? `https://youtu.be/${videoMatch[1]}` : text;

    const search = await yts(query);
    const video = videoMatch
      ? search.videos.find((v) => v.videoId === videoMatch[1]) || search.all[0]
      : search.videos[0];

    if (!video) return conn.reply(m.chat, "❌ Sin resultados.", m);

    const { title, author, url: videoUrl, timestamp, seconds } = video;

    // Validar duración
    if (seconds > MAX_DURATION)
      return conn.reply(
        m.chat,
        `⚠️ El video dura ${timestamp}, límite ${MAX_DURATION / 60} min.`,
        m
      );

    // APIs de descarga MP4
    const apiPromises = [
      tryApi("MayAPI", `https://mayapi.ooguy.com/ytdl?url=${encodeURIComponent(videoUrl)}&type=mp4&apikey=may-0595dca2`),
      tryApi("Adonix1", `https://api-adonix.ultraplus.click/download/ytmp4?apikey=Adofreekey&url=${encodeURIComponent(videoUrl)}`),
      tryApi("Adonix2", `https://api-adonix.ultraplus.click/download/ytmp4?apikey=SoyMaycol<3&url=${encodeURIComponent(videoUrl)}`),
      tryApi("Adonix3", `https://api-adonix.ultraplus.click/download/ytmp4?apikey=Angelkk122&url=${encodeURIComponent(videoUrl)}`),
    ];

    let winner;
    try {
      winner = await Promise.any(apiPromises);
    } catch {
      return conn.reply(
        m.chat,
        "⚠️ Ninguna API respondió correctamente.",
        m
      );
    }

    const downloadUrl = winner.url;
    const apiUsada = winner.api;

    // Crear carpeta tmp
    const tmpDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
    const filePath = path.join(tmpDir, `${Date.now()}_yt.mp4`);

    // Descargar con stream
    const dl = await axios.get(downloadUrl, { responseType: "stream", timeout: 0 });
    let totalSize = 0;
    dl.data.on("data", (chunk) => {
      totalSize += chunk.length;
      if (totalSize > MAX_FILE_SIZE) dl.data.destroy();
    });

    await streamPipe(dl.data, fs.createWriteStream(filePath));

    const stats = fs.statSync(filePath);
    if (stats.size > MAX_FILE_SIZE) {
      fs.unlinkSync(filePath);
      throw new Error("Archivo excede el límite de 60 MB permitido por WhatsApp.");
    }

    // Enviar video
    await conn.sendMessage(
      m.chat,
      {
        video: fs.readFileSync(filePath),
        mimetype: "video/mp4",
        fileName: `${title}.mp4`,
        caption: `
「✦」Descargando *<${title}>*

> ✐ Canal » *${author?.name || "Desconocido"}*
> ⴵ Duración » *${timestamp}*
> ✰ Calidad » *720p/1080p*
> 🌐 API » *${apiUsada}*

✔️ Video enviado con éxito, disfrútalo 🏆
        `.trim(),
        supportsStreaming: true,
      },
      { quoted: m }
    );

    fs.unlinkSync(filePath);
    await m.react("✅");
  } catch (e) {
    console.error("[ERROR]", e);
    await m.react("✖️");
    return conn.reply(m.chat, "⚠️ Error: " + e.message, m);
  }
};

handler.command = ["play2", "ytmp4", "ytv", "mp4"];
handler.help = ["play2 <texto|link>"];
handler.tags = ["descargas"];

export default handler;