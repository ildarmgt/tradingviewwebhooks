import express from 'express'
import bodyParser from 'body-parser'
// import publicIp from 'public-ip'

import { readJSON } from './helpers'
import { consoleLog } from './log'
import { runBot } from './runBot'
import { I_Settings } from './types'

const app = express() // initialize server handler
app.use(bodyParser.text()) // only read text content

const settings: I_Settings = readJSON('settings.json')

// state
const st = {
  log: [],
  coins: {}
}

/* ----------------------------------- app ---------------------------------- */

/**
 * Main server process
 */
const server = async () => {
  consoleLog(st, `Webhook server initializing`)

  // get external ip so I know / not used for now
  // const ip = await publicIp.v4()
  const ip = '___.___.___.___'
  consoleLog(st, `ip fetched:`, ip)

  // when get api hook request, compare w/ settings and execute order
  app.post('/', async (req, res) => {
    const hook = req.body
    consoleLog(st, `command received: "${hook}"`)

    // execute each matching CMD
    for (const bot of settings.bots) {
      // if match w/ this bot
      if (bot.CMD === hook) await runBot({ bot, st })
    }

    res.status(200).end()
  })

  app.get('/', (req, res) => {
    const info = `Get request @ '/'. Public ip: http://${ip}:${settings.port}/\n` + JSON.stringify(st, null, 2)

    consoleLog(st, info)
    res.send(info)
  })

  // disable after testing to quick init
  app.get('/initbuy0', (req, res) => {
    const info = `Get request @ '/initbuy0'. Public ip: http://${ip}:${settings.port}/initbuy0\n`

    consoleLog(st, info)
    res.send(info)

    runBot({ bot: settings.bots[0], st }) // init buy
  })

  app.listen(settings.port, (e) => {
    if (e) consoleLog(st, `Error listening on port ${settings.port}`)
    else consoleLog(st, `Listening on http://localhost:${settings.port}/ & public: http://${ip}:${settings.port}/\n`)
  })
}

// launch the above if settings file found
if (settings) server()
else consoleLog(st, `No settings.json found in root folder`)

/* ------------------------------ small helpers ----------------------------- */

consoleLog(st, `server.ts finished executing`)

// base is coin1
// quote is coin2
// http 80 https 443
