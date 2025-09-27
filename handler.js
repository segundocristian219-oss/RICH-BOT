import { smsg } from './lib/simple.js'
import { format } from 'util'
import { fileURLToPath } from 'url'
import path, { join } from 'path'
import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import ws from 'ws'

const { proto } = (await import('@whiskeysockets/baileys')).default

const defaultUser = {
    exp: 0, coin: 10, joincount: 1, diamond: 3, lastadventure: 0,
    health: 100, lastclaim: 0, lastcofre: 0, lastdiamantes: 0, lastcode: 0,
    lastduel: 0, lastpago: 0, lastmining: 0, lastcodereg: 0,
    muto: false, crime: 0, registered: false, genre: '', birth: '',
    marry: '', description: '', packstickers: null, name: '', age: -1,
    regTime: -1, afk: -1, afkReason: '', banned: false,
    useDocument: false, bank: 0, level: 0, role: 'Nuv',
    premium: false, premiumTime: 0
}

const defaultChat = {
    isBanned: false, welcome: true, autolevelup: false, autoresponder: false,
    delete: false, autoAceptar: false, autoRechazar: false,
    detect: true, antiBot: false, antiBot2: false, modoadmin: false,
    antiLink: true, antifake: false, reaction: false, nsfw: false,
    expired: 0, antiLag: false, per: []
}

export async function handler(chatUpdate) {
    if (!chatUpdate) return
    this.uptime = this.uptime || Date.now()

    try { this.pushMessage(chatUpdate.messages) } catch(e) { console.error(e) }
    let m = chatUpdate.messages[chatUpdate.messages.length - 1]
    if (!m) return

    if (global.db.data == null) await global.loadDatabase()
    m = smsg(this, m) || m
    if (!m) return

    // Inicialización rápida de datos
    global.db.data.users[m.sender] = { ...defaultUser, ...global.db.data.users[m.sender], name: m.name }
    global.db.data.chats[m.chat] = { ...defaultChat, ...global.db.data.chats[m.chat] }
    global.db.data.settings[this.user.jid] ||= { self: false, restrict: true, jadibotmd: true, antiPrivate: false, autoread: false, status: 0 }

    const user = global.db.data.users[m.sender]
    const chat = global.db.data.chats[m.chat]
    const settings = global.db.data.settings[this.user.jid]

    if (chat.primaryBot && chat.primaryBot !== this.user.jid && m.sender !== this.user.jid) return
    if (m.isBaileys || opts['nyimak'] || (!user && opts['self'])) return
    if (opts['swonly'] && m.chat !== 'status@broadcast') return
    if (typeof m.text !== 'string') m.text = ''
    m.exp = Math.ceil(Math.random() * 10)

    const detectwhat = m.sender.includes('@lid') ? '@lid' : '@s.whatsapp.net'
    const isROwner = global.owner.map(([n]) => n.replace(/\D/g,'') + detectwhat).includes(m.sender)
    const isOwner = isROwner || m.fromMe
    const isMods = isROwner || global.mods.map(n => n.replace(/\D/g,'') + detectwhat).includes(m.sender)
    const isPrems = isROwner || global.prems.map(n => n.replace(/\D/g,'') + detectwhat).includes(m.sender) || user.premium

    const groupMetadata = m.isGroup ? (this.chats[m.chat]?.metadata || await this.groupMetadata(m.chat).catch(_=>null)) : {}
    const participants = m.isGroup ? (groupMetadata.participants || []) : []
    const userInGroup = participants.find(p => p.id === m.sender) || {}
    const botInGroup = participants.find(p => p.id === this.user.jid) || {}
    const isRAdmin = userInGroup?.admin === "superadmin"
    const isAdmin = isRAdmin || userInGroup?.admin === "admin"
    const isBotAdmin = !!botInGroup?.admin

    const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins')
    for (let name in global.plugins) {
        let plugin = global.plugins[name]
        if (!plugin || plugin.disabled) continue
        const __filename = join(___dirname, name)

        // Plugins globales
        if (typeof plugin.all === 'function') {
            try { await plugin.all.call(this, m, { chatUpdate, __dirname: ___dirname, __filename }) } 
            catch(e) { console.error(`plugin.all error: ${name}`, e) }
        }
        if (!opts['restrict'] && plugin.tags?.includes('admin')) continue
        if (typeof plugin.before === 'function' && await plugin.before.call(this, m, { conn: this })) continue
        if (typeof plugin !== 'function') continue

        // Match del comando
        const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
        const _prefix = plugin.customPrefix || this.prefix || global.prefix
        let match = (_prefix instanceof RegExp ? [[_prefix.exec(m.text), _prefix]] :
            Array.isArray(_prefix) ? _prefix.map(p => [(p instanceof RegExp ? p : new RegExp(str2Regex(p))).exec(m.text), p instanceof RegExp ? p : new RegExp(str2Regex(p))]) :
            [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]]
        ).find(p => p[1])

        if (!match) continue
        const usedPrefix = (match[0] || '')[0]
        let noPrefix = m.text.replace(usedPrefix, '')
        let [command, ...args] = noPrefix.trim().split` `.filter(v=>v)
        args ||= []
        command = (command || '').toLowerCase()
        const isAccept = plugin.command instanceof RegExp ? plugin.command.test(command) :
            Array.isArray(plugin.command) ? plugin.command.some(cmd => cmd instanceof RegExp ? cmd.test(command) : cmd===command) :
            plugin.command === command
        if (!isAccept) continue

        // Checks
        if (chat.isBanned && !isROwner && !['grupo-unbanchat.js','owner-exec.js'].includes(name)) return
        if (user.banned && !isROwner) return m.reply(`🚫 Estás baneado/a.`)
        if (chat.modoadmin && m.isGroup && !isAdmin && !isOwner) return m.reply('🏮 Solo admins pueden usar comandos.')
        m.plugin = name

        let extra = { match, usedPrefix, noPrefix, args, command, text: args.join` `, conn: this, participants, groupMetadata, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isPrems }

        try {
            await plugin.call(this, m, extra)
            if (!isPrems) m.coin = m.coin || plugin.coin || 0
        } catch (e) {
            m.error = e
            console.error(`Error en plugin ${name}`, e)
            let text = format(e)
            for (let key of Object.values(global.APIKeys)) text = text.replace(new RegExp(key, 'g'), '*******')
            m.reply(text)
        }

        if (typeof plugin.after === 'function') {
            try { await plugin.after.call(this, m, extra) } catch(e) { console.error(`plugin.after error: ${name}`, e) }
        }

        if (m.coin) user.coin -= m.coin
        break
    }

    // Actualización de stats
    if (m.plugin) {
        let stats = global.db.data.stats
        stats[m.plugin] ||= { total:0, success:0, last:0, lastSuccess:0 }
        stats[m.plugin].total++
        stats[m.plugin].last = Date.now()
        if (!m.error) {
            stats[m.plugin].success++
            stats[m.plugin].lastSuccess = Date.now()
        }
    }

    if (opts['autoread']) await this.readMessages([m.key])
    const chatReact = global.db.data.chats[m.chat]
    if (chatReact?.reaction && !m.fromMe && m.text.match(/(ción|dad|aje|oso|izar|mente|pero|tion|age|ous|ate|and|but|ify|ai|yuki|a|s)/gi)) {
        const emot = ["🌙","🌸","👻","🔮","💫","🪄","😈","🍡","📜","🏮"][Math.floor(Math.random()*10)]
        this.sendMessage(m.chat, { react: { text: emot, key: m.key } })
    }
}

Array.prototype.getRandom = function(){ return this[Math.floor(Math.random()*this.length)] }

global.dfail = (type,m,conn,usedPrefix,command)=>{
    const msg = {
        rowner: `┏━━━✦☆✦━━━┓\n🌙 *${command}* solo mi amo supremo\n┗━━━✦☆✦━━━┛`,
        owner: `╔═══ ❖ ═══╗\n🔮 *${command}* guardianes mayores\n╚═══ ❖ ═══╝`,
        mods: `｡☆✼★━━━━★✼☆｡\n☁️ *${command}* reservado a mods\n｡☆✼★━━━━★✼☆｡`,
        premium: `✧･ﾟ: *${command}* ✧･ﾟ: solo premium UwU`,
        group: `┏(＾0＾)┛ *${command}* solo en grupo\n┗(＾0＾) ┓`,
        private: `╭(♡･ㅂ･)و *${command}* solo en privado ╰(°▽°)╯`,
        admin: `( ⚆ _ ⚆ ) *${command}* requiere admin.`,
        botAdmin: `╰(⇀︿⇀)つ-]═── *${command}* necesito ser admin`,
        un