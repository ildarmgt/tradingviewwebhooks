import express from 'express'
import fs from 'fs'
import bodyParser from 'body-parser'
import publicIp from 'public-ip'
import ccxt from 'ccxt'
import _ from 'lodash'

const app = express()
app.use(bodyParser.text()) // only read text content

const settings: I_Settings = readJSON('settings.json')
const st = {}

/* ----------------------------------- app ---------------------------------- */

const server = async () => {
  console.log(`${dateit()} Webhook server initializing`)

  // get external ip so I know
  const ip = await publicIp.v4()
  console.log(`${dateit()} ip fetched:`, ip)

  // when get api hook request, compare w/ settings and execute order
  app.post('/', async (req, res) => {
    const hook = req.body
    console.log(`${dateit()} command received: "${hook}"`)

    // execute each matching CMD
    for (const bot of settings.bots) {
      // if match w/ this bot
      if (bot.CMD === hook) await runBot(bot)
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

    runBot(settings.bots[0]) // init buy
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
else console.log('No settings.json found in root folder')

/* -------------------------------------------------------------------------- */
/*                                   actions                                  */
/* -------------------------------------------------------------------------- */

const runBot = async (bot) => {
  const { CMD, EXCHANGE, API_KEY, API_SECRET, COIN1, COIN2, TYPE } = bot
  const pair = `${COIN1}/${COIN2}`

  // initialize exchange
  const thisExchange = new ccxt[EXCHANGE]({
    apiKey: API_KEY,
    secret: API_SECRET,
    enableRateLimit: true,
    options: {
      createMarketBuyOrderRequiresPrice: false
    }
  })
  await thisExchange.loadMarkets()
  console.log(`${dateit()} ${EXCHANGE} initialized`)

  // get balances
  const balance = await thisExchange.fetchBalance()
  const amountCoin1 = balance[COIN1].total
  const amountCoin2 = balance[COIN2].total
  st[COIN1] = amountCoin1
  st[COIN2] = amountCoin2

  // get price info
  const ticker = await thisExchange.fetchTicker(pair)
  const price = (ticker.bid + ticker.ask) / 2.0

  // get minimum purchase size (overestimated)
  const minTradeUnit1 = (ticker.info.MinimumTrade || 0) * 1.1
  const minTradeUnit2 = minTradeUnit1 * price

  console.log(`${dateit()} ${EXCHANGE}:: ${amountCoin1} ${COIN1}`)
  console.log(`${dateit()} ${EXCHANGE}:: ${amountCoin2} ${COIN2}`)
  console.log(`${dateit()} ${EXCHANGE}:: ${price} ${pair}`)
  // console.log('balance1:', JSON.stringify(balance[COIN1], null, 2))
  // console.log('balance2:', JSON.stringify(balance[COIN2], null, 2))
  // console.log('ticker:', JSON.stringify(ticker, null, 2))
  // console.log(`min trade = ${minTradeUnit1} ${COIN1} or ${minTradeUnit2} ${COIN2}`)

  const isBuy = TYPE === 'buy'
  const isSell = TYPE === 'sell'

  /* --------------------------------- buying --------------------------------- */

  if (isBuy) {
    const isEnoughAvailable = amountCoin2 > minTradeUnit2
    if (isEnoughAvailable) {
      const orderSize = _.floor(amountCoin2 / price * 0.99, 8)
      console.log(`${dateit()} ${EXCHANGE}:: Placing market buy for`, orderSize, COIN1, 'with', COIN2)
      try {
        const res = await thisExchange.createMarketBuyOrder(pair, orderSize)

        // console.log('res:', JSON.stringify(res, null, 2))
        // res.info.fills is an array of { qty = coin1 sold, price = price sold at, fee.cost = fee, fee.currency = fee unit, tradeId }
        // or overall res.filled and res.cost and res.price useful
        console.log(
          `${dateit()} ${EXCHANGE}:: Done. Bought ${res.filled} ${COIN1} for ${res.cost} ${COIN2} at ${res.average} ${res.symbol} paying ${res
            .fee.cost} ${res.fee.currency} fee.`
        )
      } catch (e) {
        console.warn(`${dateit()} ${EXCHANGE}:: ${e.name}`)
      }
    } else {
      console.log(
        `${dateit()} ${EXCHANGE}:: min trade amount is ${minTradeUnit2} ${COIN2} but only ${amountCoin2} ${COIN2} available `
      )
    }
  }

  /* --------------------------------- selling -------------------------------- */

  if (isSell) {
    const isEnoughAvailable = amountCoin1 > minTradeUnit1
    if (isEnoughAvailable) {
      const orderSize = _.floor(amountCoin1 * 0.99, 8)
      console.log(`${dateit()} ${EXCHANGE}:: Placing market sell for`, pair, 'in amount of', orderSize, COIN1)
      try {
        const res = await thisExchange.createMarketSellOrder(pair, orderSize)
        // console.log('res:', JSON.stringify(res, null, 2))

        console.log(
          `${dateit()} ${EXCHANGE}:: Done. Sold ${res.filled} ${COIN1} for ${res.cost} ${COIN2} at ${res.average} ${res.symbol} paying ${res
            .fee.cost} ${res.fee.currency} fee.`
        )
      } catch (e) {
        console.warn(`${dateit()} ${EXCHANGE}:: ${e.name}`)
      }
    } else {
      console.log(
        `${dateit()} ${EXCHANGE}:: min trade amount is ${minTradeUnit1} ${COIN1} but only ${amountCoin1} ${COIN1} available `
      )
    }
  }
}

/* --------------------------------- helper --------------------------------- */

function readJSON(path: any): I_Settings {
  try {
    const res = fs.readFileSync(path).toString()
    return JSON.parse(res)
  } catch (e) {
    return {} as I_Settings
  }
}

function dateit() {
  return `\n${new Date().toISOString()}::`
}

/* ---------------------------------- types --------------------------------- */

interface I_Settings {
  port: number
  bots: [
    {
      CMD: string
      COIN1: string
      COIN2: string
      TYPE: string
      EXCHANGE: string
      API_KEY: string
      API_SECRET: string
    }
  ]
}

// base is coin1
// quote is coin2
// http 80 https 443
