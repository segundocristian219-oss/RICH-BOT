import fs from 'fs'
import PhoneNumber from 'awesome-phonenumber'

let handler = async (m, { conn }) => {
  if (m.quoted?.fromMe || m.isButton) return

  m.react('⛩️')

  const numCreador = '5215561076182'
  const name = 'Cristian ⛩️'
  const empresa = 'Cristian - Servicios tecnológicos ⛩️'
  const correo = 'correo@empresa.com'
  const imageUrl = 'https://cdn.russellxz.click/46265152.jpeg'

  // vCard simple
  const vcard = `
BEGIN:VCARD
VERSION:3.0
N:;${name};;;
FN:${name}
ORG:${empresa}
TEL;TYPE=CELL:${new PhoneNumber('+' + numCreador).getNumber('international')}
EMAIL:${correo}
END:VCARD`.trim()

  // Primero intentamos enviar como contacto embebido
  try {
    await conn.sendMessage(
      m.chat,
      {
        contacts: { displayName: name, contacts: [{ vcard }] },
        contextInfo: {
          mentionedJid: [m.sender],
          externalAdReply: {
            title: 'baki bot ⛩️',
            body: 'baki bot ⛩️',
            thumbnailUrl: imageUrl,
            mediaType: 1,
            showAdAttribution: true,
            renderLargerThumbnail: true
          }
        }
      },
      { quoted: m }
    )
  } catch (e) {
    // Si falla (WhatsApp normal / DS6 Meta), enviamos el vCard como archivo .vcf
    const filePath = './owner.vcf'
    fs.writeFileSync(filePath, vcard)

    await conn.sendMessage(
      m.chat,
      {
        document: { url: filePath },
        fileName: 'Cristian.vcf',
        mimetype: 'text/vcard',
        contextInfo: {
          mentionedJid: [m.sender],
          externalAdReply: {
            title: 'baki bot ⛩️',
            body: 'baki bot ⛩️',
            thumbnailUrl: imageUrl,
            mediaType: 1,
            showAdAttribution: true,
            renderLargerThumbnail: true
          }
        }
      },
      { quoted: m }
    )

    fs.unlinkSync(filePath)
  }
}

handler.help = ['owner']
handler.tags = ['owner']
handler.command = ['owner', 'creador']
handler.register = false
export default handler