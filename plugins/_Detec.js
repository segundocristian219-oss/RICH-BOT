export async function before(m, { conn, participants }) {
  if (!m.messageStubType || !m.isGroup) return;

  const usuario = `@${m.sender.split`@`[0]}`;
  const groupAdmins = participants.filter(p => p.admin);

  const fkontak = {
    "key": { "participants":"0@s.whatsapp.net", "remoteJid": "status@broadcast", "fromMe": false, "id": "Halo" },
    "message": {
      "contactMessage": {
        "vcard": `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
      }
    },
    "participant": "0@s.whatsapp.net"
  };

  switch (m.messageStubType) {
    case 21:
      await conn.sendMessage(m.chat, {
        text: `${usuario} \`𝐇𝐀 𝐂𝐀𝐌𝐁𝐈𝐀𝐃𝐎 𝐄𝐋 𝐍𝐎𝐌𝐁𝐑𝐄 𝐃𝐄𝐋 𝐆𝐑𝐔𝐏𝐎 𝐀:\`\n\n> *${m.messageStubParameters[0]}*`,
        mentions: [m.sender, ...groupAdmins.map(v => v.id)]
      }, { quoted: fkontak });
      break;

    case 22:
      await conn.sendMessage(m.chat, {
        text: `🫵 𝙇𝘼 𝙁𝙊𝙏𝙊 𝘿𝙀𝙇 𝙂𝙍𝙐𝙋𝙊 𝘼𝙃 𝙎𝙄𝘿𝙊 𝘼𝘾𝙏𝙐𝐀𝐋𝐈𝐙𝐀𝐃𝐀 𝙋𝙊𝙍: ${usuario}`,
        mentions: [m.sender]
      }, { quoted: fkontak });
      break;

    case 24:
      await conn.sendMessage(m.chat, {
        text: `🫵 𝙇𝘼 𝘿𝙀𝙎𝘾𝙍𝙄𝙋𝘾𝙄𝙊𝙉 𝘼𝙃 𝙎𝙄𝘿𝙊 𝙈𝙊𝘿𝙄𝙁𝙄𝐂𝐀𝐃𝐀 𝙋𝙊𝙍: ${usuario}`,
        mentions: [m.sender]
      }, { quoted: fkontak });
      break;

    case 25:
      await conn.sendMessage(m.chat, {
        text: `📌 𝐀𝐇𝐎𝐑𝐀 *${m.messageStubParameters[0] === 'on' ? '𝐒𝐎𝐋𝐎 𝐀𝐃𝐌𝐈𝐍𝐒' : '𝐓𝐎𝐃𝐎𝐒'}* 𝐏𝐔𝐄𝐃𝐄𝐍 𝐄𝐃𝐈𝐓𝐀𝐑 𝐋𝐀 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐂𝐈𝐎́𝐍 𝐃𝐄𝐋 𝐆𝐑𝐔𝐏𝐎`,
        mentions: [m.sender]
      }, { quoted: fkontak });
      break;

    case 26:
      await conn.sendMessage(m.chat, {
        text: `𝐆𝐑𝐔𝐏𝐎 *${m.messageStubParameters[0] === 'on' ? '𝐂𝐄𝐑𝐑𝐀𝐃𝐎 🔒' : '𝐀𝐁𝐈𝐄𝐑𝐓𝐎 🔓'}*\n${m.messageStubParameters[0] === 'on' ? '𝐒𝐎𝐋𝐎 𝐀𝐃𝐌𝐈𝐍𝐒 𝐏𝐔𝐄𝐃𝐄𝐍 𝐄𝐒𝐂𝐑𝐈𝐁𝐈𝐑' : '𝐘𝐀 𝐓𝐎𝐃𝐎𝐒 𝐏𝐔𝐄𝐃𝐄𝐍 𝐄𝐒𝐂𝐑𝐈𝐁𝐈𝐑'} 𝐄𝐍 𝐄𝐒𝐓𝐄 𝐆𝐑𝐔𝐏𝐎`,
        mentions: [m.sender]
      }, { quoted: fkontak });
      break;

    case 29:
      await conn.sendMessage(m.chat, {
        text: `@${m.messageStubParameters[0].split`@`[0]} 𝘼𝙃𝙊𝙍𝘼 𝙀𝙎 𝘼𝐃𝐌𝐈𝐍 𝐄𝐍 𝐄𝐒𝐓𝐄 𝐆𝐑𝐔𝐏𝐎  \n\n🫵 𝘼𝐂𝐂𝐈𝐎𝐍 𝙍𝐄𝐀𝐋𝐈𝐙𝐀𝐃𝐀 𝙋𝐎𝐑: ${usuario}`,
        mentions: [m.sender, m.messageStubParameters[0], ...groupAdmins.map(v => v.id)]
      }, { quoted: fkontak });
      break;

    case 30:
      await conn.sendMessage(m.chat, {
        text: `@${m.messageStubParameters[0].split`@`[0]} 𝐃𝐄𝐉𝐀 𝐃𝐄 𝐒𝐄𝐑 𝐀𝐃𝐌𝐈𝐍 𝐄𝐍 𝐄𝐒𝐓𝐄 𝐆𝐑𝐔𝐏𝐎\n\n🫵 𝘼𝐂𝐂𝐈𝐎𝐍 𝙍𝐄𝐀𝐋𝐈𝐙𝐀𝐃𝐀 𝙋𝐎𝐑: ${usuario}`,
        mentions: [m.sender, m.messageStubParameters[0], ...groupAdmins.map(v => v.id)]
      }, { quoted: fkontak });
      break;

    case 72:
      await conn.sendMessage(m.chat, {
        text: `${usuario} 𝐂𝐀𝐌𝐁𝐈𝐎 𝐋𝐀 𝐃𝐔𝐑𝐀𝐂𝐈𝐎́𝐍 𝐃𝐄 𝐋𝐎𝐒 𝐌𝐄𝐍𝐒𝐀𝐉𝐄𝐒 𝐓𝐄𝐌𝐏𝐎𝐑𝐀𝐋𝐄𝐒 𝐀 @${m.messageStubParameters[0]}`,
        mentions: [m.sender]
      }, { quoted: fkontak });
      break;

    case 123:
      await conn.sendMessage(m.chat, {
        text: `${usuario} 𝐃𝐄𝐒𝐀𝐂𝐓𝐈𝐕𝐎 𝐋𝐎𝐒 𝐌𝐄𝐍𝐒𝐀𝐉𝐄𝐒 𝐓𝐄𝐌𝐏𝐎𝐑𝐀𝐋𝐄𝐒.`,
        mentions: [m.sender]
      }, { quoted: fkontak });
      break;

    default:
      console.log({
        messageStubType: m.messageStubType,
        messageStubParameters: m.messageStubParameters,
      });
  }
}