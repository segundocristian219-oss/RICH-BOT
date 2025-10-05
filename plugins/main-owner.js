import PhoneNumber from 'awesome-phonenumber'

let handler = async (m, { conn }) => {
  if (m.quoted?.fromMe || m.isButton) return

  m.react('⛩️')

  const numCreador = '5215561076182'
  const name = ''
  const empresa = 'Cristian - Servicios tecnológicos ⛩️'
  const correo = 'correo@empresa.com'

  const vcard = `
BEGIN:VCARD
VERSION:3.0
N:;${name};;;
FN:${name}
ORG:${empresa}
TEL;TYPE=CELL:${new PhoneNumber('+' + numCreador).getNumber('international')}
EMAIL:${correo}
END:VCARD`.trim()

  await conn.sendMessage(
    m.chat,
    {
      contacts: {
        displayName: name,
        contacts: [{ vcard }]
      }
    },
    { quoted: m }
  )
}

handler.help = ['owner']
handler.tags = ['owner']
handler.command = ['owner', 'creador']
handler.register = false
export default handler