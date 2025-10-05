import fs from "fs";
import path from "path";

/**
 * Objeto global para manejar todos los handlers de comandos si quieres ejecutarlos directamente.
 * Ejemplo: global.handlers = { kick: handlerKick, abrirgrupo: handlerAbrirGrupo, ... }
 */
if (!global.handlers) global.handlers = {};

/**
 * Handler principal: agrega un sticker a un comando y también detecta stickers para ejecutar comandos
 */
const stickerHandler = async (msg, { conn, args }) => {
  const chatId = msg.key.remoteJid;
  const isGroup = chatId.endsWith("@g.us");
  const senderId = msg.key.participant || msg.key.remoteJid;
  const senderNum = senderId.replace(/[^0-9]/g, "");
  const isOwner = global.owner?.some(([id]) => id === senderNum);
  const isFromMe = msg.key.fromMe;

  // Verificación de permisos (solo al usar el comando .addco)
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const comandoArg = args?.join(" ").trim();

  if (comandoArg) {
    // Se está intentando vincular un sticker a un comando
    if (isGroup && !isOwner && !isFromMe) {
      const metadata = await conn.groupMetadata(chatId);
      const participant = metadata.participants.find(p => p.id === senderId);
      const isAdmin = participant?.admin === "admin" || participant?.admin === "superadmin";
      if (!isAdmin) {
        return conn.sendMessage(chatId, {
          text: "🚫 *Solo administradores, owner o el bot pueden usar este comando.*"
        }, { quoted: msg });
      }
    } else if (!isGroup && !isOwner && !isFromMe) {
      return conn.sendMessage(chatId, {
        text: "🚫 *Solo owner o el bot pueden usar este comando en privado.*"
      }, { quoted: msg });
    }

    if (!quoted?.stickerMessage) {
      return conn.sendMessage(chatId, {
        text: "❌ *Responde a un sticker para asignarle un comando.*"
      }, { quoted: msg });
    }

    const fileSha = quoted.stickerMessage.fileSha256?.toString("base64");
    if (!fileSha) {
      return conn.sendMessage(chatId, {
        text: "❌ *No se pudo obtener el ID único del sticker.*"
      }, { quoted: msg });
    }

    const jsonPath = path.resolve("./comandos.json");
    const data = fs.existsSync(jsonPath)
      ? JSON.parse(fs.readFileSync(jsonPath, "utf-8"))
      : {};

    data[fileSha] = comandoArg;
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));

    await conn.sendMessage(chatId, {
      react: { text: "✅", key: msg.key }
    });

    return conn.sendMessage(chatId, {
      text: `✅ *Sticker vinculado al comando con éxito:* \`${comandoArg}\``,
      quoted: msg
    });
  }

  // Si no se pasan argumentos, se revisa si el mensaje es un sticker enviado
  const sticker = msg.message?.stickerMessage;
  if (!sticker) return;

  const fileSha = sticker.fileSha256?.toString("base64");
  const jsonPath = path.resolve("./comandos.json");
  if (!fs.existsSync(jsonPath)) return;

  const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  const comando = data[fileSha];
  if (!comando) return;

  // Ejecuta el comando vinculado
  await conn.sendMessage(chatId, { text: `Ejecutando comando vinculado: ${comando}` });

  if (global.handlers[comando]) {
    try {
      await global.handlers[comando](msg, { conn });
    } catch (err) {
      console.error(`Error al ejecutar comando ${comando}:`, err);
    }
  }
};

stickerHandler.command = ["addco"];
stickerHandler.tags = ["tools"];
stickerHandler.help = ["addco <comando>"];

export default stickerHandler;