import fs from 'fs'
import PhoneNumber from 'awesome-phonenumber'

let handler = async (m, { conn }) => {
  if (m.quoted?.fromMe || m.isButton) return

  m.react('⛩️')

  const imageUrl = 'https://cdn.russellxz.click/46265152.jpeg'
  const numCreador = '5215561076182'
  const name = 'Cristian ⛩️'
  const empresa = 'Cristian - Servicios tecnológicos ⛩️'
  const correo = 'correo@empresa.com'

  // Crear contenido de vCard
  const vcardContent = `
BEGIN:VCARD
VERSION:3.0
N:;${name};;;
FN:${name}
ORG:${empresa}
TEL;TYPE=CELL:${new PhoneNumber('+' + numCreador).getNumber('international')}
EMAIL:${correo}
END:VCARD`.trim()

  // Guardar temporalmente en un archivo
  const filePath = './owner.vcf'
  fs.writeFileSync(filePath, vcardContent)

  // Enviar la vCard como documento
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

  // Opcional: borrar el archivo temporal después de enviarlo
  fs.unlinkSync(filePath)
}

handler.help = ['owner']
handler.tags = ['owner']
handler.command = ['owner', 'creador']
handler.register = false
export default handler