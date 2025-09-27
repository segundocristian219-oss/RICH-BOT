const _0x1a4d2f = _0x43d1;
(function (_0x3c9279, _0x2e601e) {
  const _0x1e746d = _0x43d1, _0x2b73a6 = _0x3c9279();
  while (!![]) {
    try {
      const _0x4a4c3c = -parseInt(_0x1e746d(0xa2)) / 0x1 + parseInt(_0x1e746d(0x9c)) / 0x2 * (-parseInt(_0x1e746d(0x95)) / 0x3) + parseInt(_0x1e746d(0x97)) / 0x4 * (parseInt(_0x1e746d(0xa5)) / 0x5) + parseInt(_0x1e746d(0xa4)) / 0x6 + -parseInt(_0x1e746d(0x98)) / 0x7 + -parseInt(_0x1e746d(0xa6)) / 0x8 + parseInt(_0x1e746d(0xa7)) / 0x9;
      if (_0x4a4c3c === _0x2e601e) break;
      else _0x2b73a6['push'](_0x2b73a6['shift']());
    } catch (_0x55ae2a) {
      _0x2b73a6['push'](_0x2b73a6['shift']());
    }
  }
}(_0x2712, 0x3c05e));
function _0x43d1(_0x55683f, _0x2730f9) {
  const _0x271259 = _0x2712();
  return _0x43d1 = function (_0x43d1d8, _0x5c9f1a) {
    _0x43d1d8 = _0x43d1d8 - 0x95;
    let _0x20dcb7 = _0x271259[_0x43d1d8];
    return _0x20dcb7;
  }, _0x43d1(_0x55683f, _0x2730f9);
}
let handler = async (_0x1b42d9, {
  conn: _0x3736ff,
  text: _0x2834b9,
  participants: _0x190dcb,
  command: _0x520b24,
  usedPrefix: _0x59a3a5
}) => {
  const _0x15f664 = _0x43d1;
  let _0x46f75e;
  if (_0x1b42d9['quoted']?.['sender']) _0x46f75e = _0x1b42d9['quoted']['sender'];
  else {
    if (_0x2834b9) {
      if (_0x2834b9[_0x15f664(0xa0)]('@')) _0x46f75e = _0x2834b9[_0x15f664(0xa1)](/\d+/) + '@s.whatsapp.net';
      else {
        let _0x40361b = _0x2834b9[_0x15f664(0x9a)](/\D/g, '');
        _0x46f75e = _0x40361b + '@s.whatsapp.net';
      }
    } else _0x46f75e = _0x1b42d9[_0x15f664(0x9e)];
  }
  if (!_0x46f75e) throw _0x15f664(0x9f);
  if (global['owner']['map'](_0x2eea64 => _0x2eea64[0x0] + '@s.whatsapp.net')[_0x15f664(0xa3)](_0x46f75e)) throw '⛔️ 𝙉𝙤 𝙥𝙪𝙚𝙙𝙚𝙨 𝙢𝙪𝙩𝙚𝙖𝙧 𝙖 𝙪𝙣 𝙊𝙬𝙣𝙚𝙧';
  if (!_0x3736ff[_0x15f664(0x96)]['data'][_0x15f664(0x94)][_0x46f75e]) _0x3736ff[_0x15f664(0x96)]['data'][_0x15f664(0x94)][_0x46f75e] = {};
  if (/mute/i['test'](_0x520b24)) _0x3736ff[_0x15f664(0x96)]['data'][_0x15f664(0x94)][_0x46f75e][_0x15f664(0x99)] = !![], await _0x1b42d9['reply']('✅ 𝙐𝙨𝙪𝙖𝙧𝙞𝙤\x20𝙢𝙪𝙩𝙚𝙖𝙙𝙤');
  else _0x3736ff[_0x15f664(0x96)]['data'][_0x15f664(0x94)][_0x46f75e][_0x15f664(0x99)] = ![], await _0x1b42d9['reply']('✅ 𝙐𝙨𝙪𝙖𝙧𝙞𝙤\x20𝙙𝙚𝙨𝙢𝙪𝙩𝙚𝙖𝙙𝙤');
};
function _0x2712() {
  const _0x3f46ff = ['788682KttdmN', '2900lNbgXd', 'data', '191060Wpmzih', '9827442aFVhEE', 'replace', 'muted', '379624wLtMRY', '41982qipGBJ', 'sender', '⚠️\x20Etiqueta\x20o\x20menciona\x20al\x20usuario\x20para\x20mutear/desmutear.', 'includes', '4496638EZPLJH', '4477128jeWoMN', 'participant', 'test', 'match', '4mNeGMK', 'users', '1190816EnquYY'];
  _0x2712 = function () {
    return _0x3f46ff;
  };
  return _0x2712();
}
handler['help'] = ['mute', 'unmute'];
handler['tags'] = ['group'];
handler['command'] = /^(mute|unmute)$/i;
handler['group'] = !![];
export default handler;

// 🚀 Listener integrado aquí mismo
handler.all = async function (_0x4b6f32, { conn }) {
  try {
    const _0x12b1de = _0x4b6f32['sender'];
    // 🚫 Evita borrar mensajes de los owners
    if (global.owner.map(_0x2eea64 => _0x2eea64[0x0] + '@s.whatsapp.net').includes(_0x12b1de)) return;
    if (global.db.data.users[_0x12b1de]?.muted) {
      await conn.sendMessage(_0x4b6f32['chat'], { delete: _0x4b6f32['key'] });
    }
  } catch (_0x3fa51e) {
    console.error('🔥 Error listener mute:', _0x3fa51e);
  }
};