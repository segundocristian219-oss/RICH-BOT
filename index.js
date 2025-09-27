process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'
import './config.js'
import { watchFile, unwatchFile, existsSync, mkdirSync, readdirSync } from 'fs'
import { fileURLToPath, pathToFileURL } from 'url'
import { platform } from 'process'
import cfonts from 'cfonts'
import { createRequire } from 'module'
import chalk from 'chalk'
import lodash from 'lodash'
import { makeWASocket, protoType, serialize } from './lib/simple.js'
import { Low, JSONFile } from 'lowdb'
import { mongoDB, mongoDBV2 } from './lib/mongoDB.js'
import store from './lib/store.js'
import NodeCache from 'node-cache'
import pino from 'pino'
import yargs from 'yargs'
import path, { join } from 'path'
import { useMultiFileAuthState, fetchLatestBaileysVersion, jidNormalizedUser, makeCacheableSignalKeyStore, Browsers, DisconnectReason } from '@whiskeysockets/baileys'

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
    return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString()
}

global.__dirname = function dirname(pathURL) {
    return path.dirname(global.__filename(pathURL, true))
}

const __dirname = global.__dirname(import.meta.url)

global.opts = yargs(process.argv.slice(2)).exitProcess(false).parse()
global.prefix = new RegExp('^[#!./]')

// Carga DB
global.db = new Low(/https?:\/\//.test(opts['db'] || '') ? new cloudDBAdapter(opts['db']) : new JSONFile('database.json'))
global.DATABASE = global.db
global.loadDatabase = async function loadDatabase() {
    if (global.db.READ) {
        return new Promise(resolve => setInterval(async function () {
            if (!global.db.READ) {
                clearInterval(this)
                resolve(global.db.data == null ? global.loadDatabase() : global.db.data)
            }
        }, 1000))
    }
    if (global.db.data !== null) return
    global.db.READ = true
    await global.db.read().catch(console.error)
    global.db.READ = null
    global.db.data = {
        users: {},
        chats: {},
        stats: {},
        msgs: {},
        sticker: {},
        settings: {},
        ...(global.db.data || {}),
    }
    global.db.chain = lodash.chain(global.db.data)
}
await loadDatabase()

if (!existsSync("./tmp")) mkdirSync("./tmp")

const { state, saveCreds } = await useMultiFileAuthState(global.sessions)
const msgRetryCounterCache = new NodeCache({ stdTTL: 0, checkperiod: 0 })
const userDevicesCache = new NodeCache({ stdTTL: 0, checkperiod: 0 })
const { version } = await fetchLatestBaileysVersion()

// Init cfonts
const { say } = cfonts
console.log(chalk.magentaBright('\nIniciando MaycolPlus...'))
say('MaycolPlus', { font: 'block', align: 'center', gradient: ['grey', 'white'] })
say('Hecho por SoyMaycol', { font: 'console', align: 'center', colors: ['cyan', 'magenta', 'yellow'] })

protoType()
serialize()

// Conexión principal
const connectionOptions = {
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
    browser: Browsers.macOS("Desktop"),
    auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' })),
    },
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
    getMessage: async (key) => {
        try {
            let jid = jidNormalizedUser(key.remoteJid)
            let msg = await store.loadMessage(jid, key.id)
            return msg?.message || ""
        } catch {
            return ""
        }
    },
    msgRetryCounterCache,
    userDevicesCache,
    version,
    keepAliveIntervalMs: 55000,
    maxIdleTimeMs: 60000,
}

global.conn = makeWASocket(connectionOptions)
conn.credsUpdate = saveCreds.bind(conn, true)

process.on('uncaughtException', console.error)

// Handler
let handler = await import('./handler.js')
global.reloadHandler = async function(restarConn = false) {
    const Handler = await import(`./handler.js?update=${Date.now()}`).catch(console.error)
    if (Object.keys(Handler || {}).length) handler = Handler
    if (restarConn) {
        try { global.conn.ws.close() } catch { }
        conn.ev.removeAllListeners()
        global.conn = makeWASocket(connectionOptions)
    }
    conn.handler = handler.handler.bind(global.conn)
    conn.connectionUpdate = connectionUpdate.bind(global.conn)
    conn.credsUpdate = saveCreds.bind(global.conn, true)
    conn.ev.on('messages.upsert', conn.handler)
    conn.ev.on('connection.update', conn.connectionUpdate)
    conn.ev.on('creds.update', conn.credsUpdate)
}

// Conexión update
async function connectionUpdate(update) {
    const { connection, lastDisconnect, isNewLogin } = update
    if (isNewLogin) conn.isInit = true
    if (connection === 'open') console.log(chalk.green.bold(`[ ✿ ] Conectado a: ${conn.user.name || 'Desconocido'}`))
    if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode
        console.log(chalk.redBright(`[ ⚠ ] Conexión cerrada, code: ${reason}`))
        await global.reloadHandler(true)
    }
}

// Plugins
const pluginFolder = join(__dirname, './plugins/index')
global.plugins = {}
const pluginFilter = filename => /\.js$/.test(filename)
async function filesInit() {
    for (const filename of readdirSync(pluginFolder).filter(pluginFilter)) {
        try {
            const file = global.__filename(join(pluginFolder, filename))
            const module = await import(file)
            global.plugins[filename] = module.default || module
        } catch (e) {
            conn.logger.error(e)
            delete global.plugins[filename]
        }
    }
}
await filesInit()

global.reload = async (_ev, filename) => {
    if (!pluginFilter(filename)) return
    const dir = global.__filename(join(pluginFolder, filename), true)
    if (filename in global.plugins) {
        if (!existsSync(dir)) conn.logger.warn(`deleted plugin - '${filename}'`)
    } else conn.logger.info(`new plugin - '${filename}'`)
    const err = await import(`${dir}?update=${Date.now()}`).catch(console.error)
    global.plugins[filename] = err?.default || err
}
watchFile(pluginFolder, global.reload)

// Autoguardado DB
setInterval(async () => {
    if (global.db.data) await global.db.write()
}, 30 * 1000)