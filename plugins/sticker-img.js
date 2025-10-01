import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { exec as execCb } from 'child_process';

const exec = promisify(execCb);

const handler = async (msg, { conn }) => {
    try {
        // Verificar si se está respondiendo a un sticker
        if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage) {
            return conn.sendMessage(msg.key.remoteJid, { 
                text: "⚠️ *Debes responder a un sticker para convertirlo en imagen.*" 
            }, { quoted: msg });
        }

        // Reacción de proceso
        await conn.sendMessage(msg.key.remoteJid, { 
            react: { text: "🕒", key: msg.key } 
        });

        // Obtener el sticker citado
        const quoted = msg.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage;
        const stickerStream = await downloadContentFromMessage(quoted, "sticker");

        // Leer el buffer del sticker
        let buffer = Buffer.alloc(0);
        for await (const chunk of stickerStream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        if (buffer.length === 0) {
            throw new Error("Buffer vacío");
        }

        // Crear directorio temporal si no existe
        const tmpDir = path.join(path.resolve(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

        // Rutas de archivos temporales
        const stickerPath = path.join(tmpDir, `${Date.now()}.webp`);
        const imagePath = path.join(tmpDir, `${Date.now()}.png`);

        // Guardar sticker temporalmente
        fs.writeFileSync(stickerPath, buffer);

        // Convertir usando ffmpeg
        try {
            await exec(`ffmpeg -i "${stickerPath}" -vcodec png "${imagePath}"`);

            // Verificar si la conversión fue exitosa
            if (!fs.existsSync(imagePath)) {
                throw new Error("La conversión falló");
            }

            // Enviar imagen resultante
            await conn.sendMessage(msg.key.remoteJid, { 
                image: fs.readFileSync(imagePath),
                caption: ""
            }, { quoted: msg });

            // Reacción de éxito
            await conn.sendMessage(msg.key.remoteJid, { 
                react: { text: "✅", key: msg.key } 
            });

        } catch (convertError) {
            console.error("Error en conversión:", convertError);
            throw new Error("Error al convertir el sticker");
        } finally {
            // Eliminar archivos temporales
            try {
                if (fs.existsSync(stickerPath)) fs.unlinkSync(stickerPath);
                if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
            } catch (cleanError) {
                console.error("Error limpiando archivos:", cleanError);
            }
        }

    } catch (error) {
        console.error("Error en toimg:", error);
        await conn.sendMessage(msg.key.remoteJid, { 
            text: "❌ *Ocurrió un error al convertir el sticker. Asegúrate que es un sticker válido.*" 
        }, { quoted: msg });
    }
};

handler.command = ['toimg', 'stickerimg', 'img'];
handler.tags = ['tools'];
handler.help = [
    'toimg <responder a sticker> - Convierte sticker a imagen',
    'stickerimg <responder a sticker> - Convierte sticker a imagen',
    'img <responder a sticker> - Convierte sticker a imagen'
];

export default handler;