/** FULL TURBO INDEX.JS by Angel x ChatGPT **/

import './config.js'
import path, { join } from 'path'
import { createRequire } from 'module'
import * as ws from 'ws'
import { fileURLToPath } from 'url'
import { platform } from 'process'
import { readdirSync, existsSync, mkdirSync, rmSync, watch } from 'fs'
import { createInterface } from 'readline'
import { spawn } from 'child_process'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import lodash from 'lodash'
import chalk from 'chalk'
import syntaxerror from 'syntax-error'
import { tmpdir } from 'os'
import { makeWASocket, protoType, serialize } from './lib/simple.js'
import { Low, JSONFile } from 'lowdb'
import { mongoDB, mongoDBV2 } from './lib/mongoDB.js'
import store from './lib/store.js'

const { makeWASocket: makeSocket } = await import('@whiskeysockets/baileys')

/* ---------- CONFIGURACIONES ----------- */
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(__dirname)
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000

global.opts = new Object(yargs(hideBin(process.argv)).exitProcess(false).parse())
global.prefix = new RegExp('^[' + (opts.prefix || '*/!#$%+×÷.?').replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&') + ']')
global.db = new Low(/https?:\/\//.test(opts['db'] || '') ? new cloudDBAdapter(opts['db']) : /mongodb(\+srv)?:\/\//i.test(opts['db']) ? (opts['mongodbv2'] ? new mongoDBV2(opts['db']) : new mongoDB(opts['db'])) : new JSONFile(`${opts._[0] ? opts._[0] + '_' : ''}database.json`))
global.DATABASE = global.db // backwards compat
global.loadDatabase = async function loadDatabase() {
  if (global.db.READ) return global.db.data
  global.db.READ = true
  await global.db.read().catch(console.error)
  global.db.READ = null
  global.db.data = global.db.data || { users: {}, chats: {}, stats: {}, msgs: {}, sticker: {}, settings: {}, menfess: {}, others: {}, ...(global.db.data || {}) }
  return global.db.data
}

/* ---------- CARGA DB RAM ----------- */
if (!existsSync('./sessions')) mkdirSync('./sessions')
await global.loadDatabase()
setInterval(async () => {
  if (global.db.data) await global.db.write()
}, 30_000) // guarda cada 30s, turbo pero seguro

/* ---------- ARRANQUE ----------- */
const { CONNECTING } = ws
protoType()
serialize()

global.conn = makeWASocket({
  printQRInTerminal: true,
  auth: store.useSession('./sessions'),
  logger: { level: 'silent' },
  browser: ['SKY TURBO', 'Chrome', '120.0.6099.71'],
  connectTimeoutMs: 30_000,
  keepAliveIntervalMs: 30_000,
  maxIdleTimeMs: 30_000
})

/* ---------- HANDLER TURBO ----------- */
const handlerPath = join(__dirname, './handler.js')
async function reloadHandler() {
  const { default: handler } = await import(`${handlerPath}?update=${Date.now()}`)
  global.conn.handler = handler.handler.bind(global.conn)
  global.conn.ev.removeAllListeners('messages.upsert')
  // Cola turbo anti-lag
  global.conn.ev.on('messages.upsert', (msg) => {
    setImmediate(() => {
      try {
        global.conn.handler(msg)
      } catch (e) {
        console.error(chalk.red('Error en handler:'), e)
      }
    })
  })
}
await reloadHandler()

/* ---------- WATCHER ----------- */
watch(handlerPath, reloadHandler)
watch(join(__dirname, 'plugins'), () => reloadHandler())

/* ---------- ERRORES GLOBALES ----------- */
process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)

console.log(chalk.greenBright.bold(`✅ Bot TURBO corriendo en puerto ${PORT}`))