let handler = async (m, { conn, groupMetadata }) => {
  let who = m.mentionedJid?.[0]
    ? m.mentionedJid[0]
    : m.quoted
    ? m.quoted.sender
    : m.sender;

  let nro = Math.floor(Math.random() * 501); // Valor entre 0 y 500
  let mensaje = `@${who.split("@")[0]} es un puto y es un ${nro}% Gay 🏳️‍🌈.`;

  await m.reply(mensaje, null, { mentions: [who] });
};

handler.help = ['gay'];
handler.tags = ['fun'];
handler.command = ['cekgay', 'gay'];
handler.group = true;

export default handler;