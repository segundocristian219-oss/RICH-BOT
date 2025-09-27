const _0x1905e8 = _0x1b27;
(function (_0x2d56bf, _0x1e3f10) {
  const _0x8cca4c = _0x1b27,
    _0x25af69 = _0x2d56bf();
  while (!![]) {
    try {
      const _0x77255f =
        (-parseInt(_0x8cca4c(0x98)) / 0x1) * (-parseInt(_0x8cca4c(0x8e)) / 0x2) +
        parseInt(_0x8cca4c(0x82)) / 0x3 +
        -parseInt(_0x8cca4c(0x8a)) / 0x4 +
        parseInt(_0x8cca4c(0x85)) / 0x5 +
        (parseInt(_0x8cca4c(0x8f)) / 0x6) * (parseInt(_0x8cca4c(0x97)) / 0x7) +
        parseInt(_0x8cca4c(0xa0)) / 0x8 +
        (-parseInt(_0x8cca4c(0x9e)) / 0x9) * (parseInt(_0x8cca4c(0xa1)) / 0xa);
      if (_0x77255f === _0x1e3f10) break;
      else _0x25af69.push(_0x25af69.shift());
    } catch (_0x55a858) {
      _0x25af69.push(_0x25af69.shift());
    }
  }
})(_0x4397, 0xd9d98);

import _0x15ca36 from "node-fetch";

const handler = async (_0x4960d9, { conn: _0x1d1981, command: _0x2159df, text: _0x577e36 }) => {
  const _0x82d6a1 = _0x1b27;

  const _0x1facb5 = global.owner[0][0] + "@s.whatsapp.net";
  let _0x8acb16 = _0x4960d9[_0x82d6a1(0x87)]?.[0]
    ? _0x4960d9[_0x82d6a1(0x87)][0]
    : _0x4960d9[_0x82d6a1(0x94)]
    ? _0x4960d9[_0x82d6a1(0x94)][_0x82d6a1(0xa3)]
    : _0x577e36;

  if (_0x8acb16 === conn.user.jid) return; // no mutear al bot
  if (global.owner.map(v => v[0] + "@s.whatsapp.net").includes(_0x8acb16))
    return; // no mutear a owners
  if (_0x8acb16 === _0x1facb5) throw "😼 *El creador del bot no puede ser mutado*";

  let _0x2c1dd9 = global.db.data.users[_0x8acb16];

  if (_0x2159df === "mute") {
    if (_0x2c1dd9?.muted) throw "😼 *Este usuario ya ha sido mutado*";

    try {
      await conn.sendMessage(
        _0x4960d9.chat,
        {
          text: `𝗨𝘀𝘂𝗮𝗿𝗶𝗼 mutado ✅`,
        },
        { mentions: [_0x8acb16] }
      );
      _0x2c1dd9.muted = true;
    } catch (e) {
      console.error("⚠️ No se pudo mutear (verifica que el bot sea admin)", e);
    }
  } else if (_0x2159df === "unmute") {
    if (!_0x2c1dd9?.muted) throw "😼 *Este usuario no ha sido mutado*";

    try {
      await conn.sendMessage(
        _0x4960d9.chat,
        {
          text: `𝗨𝘀𝘂𝗮𝗿𝗶𝗼 demutado ✅`,
        },
        { mentions: [_0x8acb16] }
      );
      _0x2c1dd9.muted = false;
    } catch (e) {
      console.error("⚠️ No se pudo desmutear (verifica que el bot sea admin)", e);
    }
  }
};

// ⛔ Listener interno: borrar mensajes de usuarios muteados
handler.all = async function (_0x4960d9, { conn }) {
  try {
    const _0x12b1de = _0x4960d9.sender;
    if (!_0x12b1de) return;

    if (_0x12b1de === conn.user.jid) return; // bot
    if (global.owner.map(v => v[0] + "@s.whatsapp.net").includes(_0x12b1de)) return; // owners

    if (global.db.data.users[_0x12b1de]?.muted) {
      try {
        await conn.sendMessage(_0x4960d9.chat, { delete: _0x4960d9.key });
      } catch (e) {
        console.error("⚠️ No se pudo borrar mensaje (bot debe ser admin)", e);
      }
    }
  } catch (e) {
    console.error("⚠️ Error al borrar mensaje:", e);
  }
};

// 🔥 Flags finales
handler.command = /^(mute|unmute)$/i;
handler.group = !![];

export default handler;