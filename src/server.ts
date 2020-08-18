import express from 'express'
import bodyParser from 'body-parser'
import publicIp from 'public-ip'

import { dateit, readJSON } from './helpers'
import { runBot } from './runBot'
import { I_Settings } from './types'

const app = express() // initialize server handler
app.use(bodyParser.text()) // only read text content

const settings: I_Settings = readJSON('settings.json')
const st = {}

/* ----------------------------------- app ---------------------------------- */

/**
 * Main server process
 */
const server = async () => {
  console.log(`${dateit()} Webhook server initializing`)

  // get external ip so I know
  // const ip = await publicIp.v4()
  const ip = 'localhost' // temp replace slow step
  console.log(`${dateit()} ip fetched:`, ip)

  // when get api hook request, compare w/ settings and execute order
  app.post('/', async (req, res) => {
    const hook = req.body
    console.log(`${dateit()} command received: "${hook}"`)

    // execute each matching CMD
    for (const bot of settings.bots) {
      // if match w/ this bot
      if (bot.CMD === hook) await runBot({ bot, st })
    }

    res.status(200).end()
  })

  app.get('/', (req, res) => {
    const info =
      `${dateit()} Get request @ '/'. Public ip: http://${ip}:${settings.port}/\n` + JSON.stringify(st, null, 2)

    console.log(info)
    res.send(info)
  })

  // disable after testing to quick init
  app.get('/initbuy0', (req, res) => {
    const info = `${dateit()} Get request @ '/initbuy0'. Public ip: http://${ip}:${settings.port}/initbuy0\n`

    console.log(info)
    res.send(info)

    runBot({ bot: settings.bots[0], st }) // init buy
  })

  app.listen(settings.port, (e) => {
    if (e) console.log(`Error listening on port ${settings.port}`)
    else
      console.log(
        `${dateit()} Listening on http://localhost:${settings.port}/ & public: http://${ip}:${settings.port}/\n`
      )
  })
}

if (settings) server()
else console.log(`${dateit()} No settings.json found in root folder`)

/* ------------------------------ small helpers ----------------------------- */

console.log(`${dateit()} server.ts finished executing`)

// base is coin1
// quote is coin2
// http 80 https 443
