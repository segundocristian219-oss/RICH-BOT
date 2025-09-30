import axios from "axios";
import yts from "yt-search";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { pipeline } from "stream";

const streamPipe = promisify(pipeline);
const MAX_FILE_SIZE = 60 * 1024 * 1024; // 60 MB
const MAX_DURATION = 10 * 60; // 10 min en segundos

// Función para probar APIs
const tryApi = async (name, url) => {
  try {
    const res = await axios.get(url, { timeout: 12000 });
    const link = res.data?.result?.url || res.data?.data?.url || res.data?.res?.url;
    if (!link) throw new Error("No hay link válido");
    return { url: link, api: name };
  } catch (e) {
    throw new Error(`${name} falló: ${e.message}`);
  }
};

const handler = async (m, { conn, text, command }) => {
  try {
    if (!text?.trim()) return conn.reply(m.chat, "🎬 Ingresa el nombre o link de un video", m);

    await m.react("🕒");

    // Detectar link directo
    const videoMatch = text.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/
    );
    const query = videoMatch ? `https://youtu.be/${videoMatch[1]}` : text;

    // Buscar video
    const search = await yts(query);
    const video = videoMatch
      ? search.videos.find((v) => v.videoId === videoMatch[1]) || search.all[0]
      : search.videos[0];

    if (!video) return conn.reply(m.chat, "❌ No se encontraron resultados.", m);

    const { title, author, url: videoUrl, timestamp, seconds } = video;

    // Validar duración
    if (seconds > MAX_DURATION) {
      return conn.reply(
        m.chat,
        `⚠️ El video dura ${timestamp}, máximo permitido ${MAX_DURATION / 60} min.`,
        m
      );
    }

    // Competencia entre APIs
    const apiPromises = [
      tryApi("MayAPI", `https://mayapi.ooguy.com/ytdl?url=${encodeURIComponent(videoUrl)}&type=mp4&quality=720&apikey=may-0595dca2`),
      tryApi("Adonix1", `https://api-adonix.ultraplus.click/download/ytmp4?apikey=Adofreekey&url=${encodeURIComponent(videoUrl)}`),
      tryApi("Adonix2", `https://api-adonix.ultraplus.click/download/ytmp4?apikey=SoyMaycol<3&url=${encodeURIComponent(videoUrl)}`),
      tryApi("Adonix3", `https://api-adonix.ultraplus.click/download/ytmp4?apikey=Angelkk122&url=${encodeURIComponent(videoUrl)}`),
      tryApi("Sylphy", `https://api.sylphy.xyz/download/ytmp4?url=${encodeURIComponent(videoUrl)}&apikey=sylphy-fbb9&quality=720`)
    ];

    let winner;
    try {
      winner = await Promise.any(apiPromises);
    } catch {
      return conn.reply(m.chat, "⚠️ Ninguna API respondió correctamente.", m);
    }

    // Enviar video directo desde URL (rápido, streaming)
    await conn.sendMessage(
      m.chat,
      {
        video: { url: winner.url },
        mimetype: "video/mp4",
        fileName: `${title}.mp4`,
        caption: `
「✦」*${title}*

> ✐ Canal » *${author?.name || "Desconocido"}*
> ⏱ Duración » *${timestamp}*
> 🌐 API » *${winner.api}*

✔️ Video enviado con éxito 🏆
        `.trim(),
        supportsStreaming: true,
      },
      { quoted: m }
    );

    await m.react("✅");
  } catch (e) {
    console.error("[ERROR]", e);
    await m.react("✖️");
    return conn.reply(m.chat, "⚠️ Error: " + e.message, m);
  }
};

handler.command = ["play3", "ytmp4", "ytv", "mp4"];
handler.help = ["play2 <texto|link>"];
handler.tags = ["descargas"];

export default handler;