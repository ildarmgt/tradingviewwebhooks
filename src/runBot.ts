import ccxt from 'ccxt'
import _ from 'lodash'
import { consoleLog } from './log'
// import { dateit } from './helpers'

export const runBot = async ({ bot, st }) => {
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
  consoleLog(st, `${EXCHANGE} initialized`)

  // get balances
  const balance = await thisExchange.fetchBalance()
  const amountCoin1 = balance[COIN1].total
  const amountCoin2 = balance[COIN2].total
  st.coins[COIN1] = amountCoin1
  st.coins[COIN2] = amountCoin2

  // get price info
  const ticker = await thisExchange.fetchTicker(pair)
  const price = (ticker.bid + ticker.ask) / 2.0

  // get minimum purchase size (overestimated)
  const minTradeUnit1 = (ticker.info.MinimumTrade || 0) * 1.1
  const minTradeUnit2 = minTradeUnit1 * price

  consoleLog(st, `${EXCHANGE}:: ${amountCoin1} ${COIN1}`)
  consoleLog(st, `${EXCHANGE}:: ${amountCoin2} ${COIN2}`)
  consoleLog(st, `${EXCHANGE}:: ${price} ${pair}`)
  // consoleLog(st, 'balance1:', JSON.stringify(balance[COIN1], null, 2))
  // consoleLog(st, 'balance2:', JSON.stringify(balance[COIN2], null, 2))
  // consoleLog(st, 'ticker:', JSON.stringify(ticker, null, 2))
  // consoleLog(st, `min trade = ${minTradeUnit1} ${COIN1} or ${minTradeUnit2} ${COIN2}`)

  const isBuy = TYPE === 'buy'
  const isSell = TYPE === 'sell'

  /* --------------------------------- buying --------------------------------- */

  if (isBuy) {
    const isEnoughAvailable = amountCoin2 > minTradeUnit2
    if (isEnoughAvailable) {
      const orderSize = _.floor(amountCoin2 / price * 0.99, 8)
      consoleLog(st, `${EXCHANGE}:: Placing market buy for`, orderSize, COIN1, 'with', COIN2)
      try {
        const res = await thisExchange.createMarketBuyOrder(pair, orderSize)

        consoleLog(
          st,
          `${EXCHANGE}:: Done. Bought ${res.filled} ${COIN1} for ${res.cost} ${COIN2}` +
            ` at ${res.average} ${res.symbol} paying ${res.fee.cost} ${res.fee.currency} fee.`
        )
        // account for changes
        st.coins[COIN1] += res.filled
        st.coins[COIN2] -= res.cost
      } catch (e) {
        console.warn(`${EXCHANGE}:: ${e.name}`)
      }
    } else {
      consoleLog(
        st,
        `${EXCHANGE}:: min trade amount is ${minTradeUnit2} ${COIN2} but only ${amountCoin2} ${COIN2} available `
      )
    }
  }

  /* --------------------------------- selling -------------------------------- */

  if (isSell) {
    const isEnoughAvailable = amountCoin1 > minTradeUnit1
    if (isEnoughAvailable) {
      const orderSize = _.floor(amountCoin1 * 0.99, 8)
      consoleLog(st, `${EXCHANGE}:: Placing market sell for`, pair, 'in amount of', orderSize, COIN1)
      try {
        const res = await thisExchange.createMarketSellOrder(pair, orderSize)

        consoleLog(
          st,
          `${EXCHANGE}:: Done. Sold ${res.filled} ${COIN1} for ${res.cost} ${COIN2} ` +
            `at ${res.average} ${res.symbol} paying ${res.fee.cost} ${res.fee.currency} fee.`
        )
        st.coins[COIN1] -= res.filled
        st.coins[COIN2] += res.cost
      } catch (e) {
        console.warn(`${EXCHANGE}:: ${e.name}`)
      }
    } else {
      consoleLog(
        st,
        `${EXCHANGE}:: min trade amount is ${minTradeUnit1} ${COIN1} but only ${amountCoin1} ${COIN1} available `
      )
    }
  }
}
