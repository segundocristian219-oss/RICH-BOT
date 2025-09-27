const _0x1905e8 = _0x1b27
;(function (_0x2d56bf, _0x1e3f10) {
  const _0x8cca4c = _0x1b27,
    _0x25af69 = _0x2d56bf()
  while (!![]) {
    try {
      const _0x77255f =
        (-parseInt(_0x8cca4c(0x98)) / 0x1) * (-parseInt(_0x8cca4c(0x8e)) / 0x2) +
        parseInt(_0x8cca4c(0x82)) / 0x3 +
        -parseInt(_0x8cca4c(0x8a)) / 0x4 +
        parseInt(_0x8cca4c(0x85)) / 0x5 +
        (parseInt(_0x8cca4c(0x8f)) / 0x6) * (parseInt(_0x8cca4c(0x97)) / 0x7) +
        parseInt(_0x8cca4c(0xa0)) / 0x8 +
        (-parseInt(_0x8cca4c(0x9e)) / 0x9) * (parseInt(_0x8cca4c(0xa1)) / 0xa)
      if (_0x77255f === _0x1e3f10) break
      else _0x25af69.push(_0x25af69.shift())
    } catch (_0x55a858) {
      _0x25af69.push(_0x25af69.shift())
    }
  }
})(_0x4397, 0xd9d98)

import _0x15ca36 from 'node-fetch'

const handler = async (_0x4960d9, { conn: _0x1d1981, command: _0x2159df, text: _0x577e36 }) => {
  const _0x82d6a1 = _0x1b27
  if (_0x2159df === _0x82d6a1(0x88)) {
    const _0x1facb5 = global.owner[0x0][0x0] + _0x82d6a1(0x83)
    if (_0x4960d9[_0x82d6a1(0x87)][0x0] === _0x1facb5) throw '😼 *El creador del bot no puede ser mutado*'

    // 🚫 Evita mutear owners
    if (global.owner.map(v => v[0] + '@s.whatsapp.net').includes(_0x4960d9[_0x82d6a1(0x87)][0x0])) {
      throw '⛔️ *No puedes mutear a un Owner*'
    }

    let _0x8acb16 = _0x4960d9[_0x82d6a1(0x87)][0x0]
      ? _0x4960d9[_0x82d6a1(0x87)][0x0]
      : _0x4960d9[_0x82d6a1(0x94)]
      ? _0x4960d9[_0x82d6a1(0x94)][_0x82d6a1(0xa3)]
      : _0x577e36
    if (_0x8acb16 === _0x1d1981[_0x82d6a1(0x9b)][_0x82d6a1(0x93)]) throw _0x82d6a1(0xa6)

    let _0x2c1dd9 = global.db[_0x82d6a1(0x99)].users[_0x8acb16],
      _0x571e77 = {
        key: { participants: _0x82d6a1(0x84), fromMe: ![], id: _0x82d6a1(0x90) },
        message: {
          locationMessage: {
            name: _0x82d6a1(0xa5),
            jpegThumbnail: await (await _0x15ca36('https://telegra.ph/file/f8324d9798fa2ed2317bc.png'))[_0x82d6a1(0x8b)](),
            vcard: _0x82d6a1(0x7c),
          },
        },
        participant: '0@s.whatsapp.net',
      },
      _0x5da6a1 = _0x82d6a1(0x7f)

    if (!_0x4960d9[_0x82d6a1(0x87)][0x0] && !_0x4960d9[_0x82d6a1(0x94)])
      return _0x1d1981[_0x82d6a1(0x89)](_0x4960d9.chat, _0x5da6a1, _0x4960d9)

    if (_0x2c1dd9[_0x82d6a1(0x96)] === !![]) throw _0x82d6a1(0x7e)
    ;(_0x1d1981[_0x82d6a1(0x89)](_0x4960d9[_0x82d6a1(0x9f)], _0x82d6a1(0x8d), _0x571e77, null, { mentions: [_0x8acb16] }),
    (global.db[_0x82d6a1(0x99)][_0x82d6a1(0xa2)][_0x8acb16][_0x82d6a1(0x96)] = !![]))
  } else {
    if (_0x2159df === 'unmute') {
      let _0x581bd4 = _0x4960d9[_0x82d6a1(0x87)][0x0]
          ? _0x4960d9[_0x82d6a1(0x87)][0x0]
          : _0x4960d9.quoted
          ? _0x4960d9[_0x82d6a1(0x94)].sender
          : _0x577e36,
        _0x5e6d75 = global.db[_0x82d6a1(0x99)][_0x82d6a1(0xa2)][_0x581bd4],
        _0x55c898 = {
          key: { participants: _0x82d6a1(0x84), fromMe: ![], id: _0x82d6a1(0x90) },
          message: {
            locationMessage: {
              name: '𝗨𝘀𝘂𝗮𝗿𝗶𝗼 demutado',
              jpegThumbnail: await (await _0x15ca36('https://telegra.ph/file/aea704d0b242b8c41bf15.png'))[_0x82d6a1(0x8b)](),
              vcard:
                'BEGIN:VCARD\x0aVERSION:3.0\x0aN:;Unlimited;;;\x0aFN:Unlimited\x0aORG:Unlimited\x0aTITLE:\x0aitem1.TEL;waid=19709001746:+1\x20(970)\x20900-1746\x0aitem1.X-ABLabel:Unlimited\x0aX-WA-BIZ-DESCRIPTION:ofc\x0aX-WA-BIZ-NAME:Unlimited\x0aEND:VCARD',
            },
          },
          participant: _0x82d6a1(0x84),
        },
        _0x17fcd1 = _0x82d6a1(0x8c)

      if (_0x581bd4 === _0x4960d9[_0x82d6a1(0xa3)]) throw _0x82d6a1(0xa4)
      if (!_0x4960d9[_0x82d6a1(0x87)][0x0] && !_0x4960d9[_0x82d6a1(0x94)])
        return _0x1d1981[_0x82d6a1(0x89)](_0x4960d9[_0x82d6a1(0x9f)], _0x17fcd1, _0x4960d9)
      if (_0x5e6d75[_0x82d6a1(0x96)] === ![]) throw _0x82d6a1(0x9c)
      ;((global.db[_0x82d6a1(0x99)][_0x82d6a1(0xa2)][_0x581bd4][_0x82d6a1(0x96)] = ![]),
      _0x1d1981[_0x82d6a1(0x89)](_0x4960d9[_0x82d6a1(0x9f)], _0x82d6a1(0x80), _0x55c898, null, { mentions: [_0x581bd4] }))
    }
  }
}

// ⛔ Listener interno: borrar mensajes de usuarios muteados
handler.all = async function (_0x4960d9, { conn }) {
  try {
    const _0x12b1de = _0x4960d9.sender
    if (!_0x12b1de) return

    // 🚫 no borrar al bot ni a owners
    if (_0x12b1de === conn.user.jid) return
    if (global.owner.map(v => v[0] + '@s.whatsapp.net').includes(_0x12b1de)) return

    if (global.db.data.users[_0x12b1de]?.muted) {
      await conn.sendMessage(_0x4960d9.chat, { delete: _0x4960d9.key })
    }
  } catch (e) {
    console.error('⚠️ Error al borrar mensaje:', e)
  }
}

;((handler.command = /^(mute|unmute)$/i), (handler.group = !![]))

export default handler