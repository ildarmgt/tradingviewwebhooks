"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBot = void 0;
const ccxt_1 = __importDefault(require("ccxt"));
const lodash_1 = __importDefault(require("lodash"));
const log_1 = require("./log");
// import { dateit } from './helpers'
const UNDERSIZE_RATIO = 0.99;
const MIN_TRADE_OVERSIZE_RATIO = 1.1;
exports.runBot = ({ bot, st }) => __awaiter(void 0, void 0, void 0, function* () {
    const { CMD, EXCHANGE, API_KEY, API_SECRET, COIN1, COIN2, TYPE } = bot;
    const pair = `${COIN1}/${COIN2}`;
    // initialize exchange
    const thisExchange = new ccxt_1.default[EXCHANGE]({
        apiKey: API_KEY,
        secret: API_SECRET,
        enableRateLimit: true,
        options: {
            createMarketBuyOrderRequiresPrice: false
        }
    });
    yield thisExchange.loadMarkets();
    log_1.consoleLog(st, `${EXCHANGE} initialized`);
    // get balances
    const balance = yield thisExchange.fetchBalance();
    const amountCoin1 = balance[COIN1].total;
    const amountCoin2 = balance[COIN2].total;
    st.coins[COIN1] = amountCoin1;
    st.coins[COIN2] = amountCoin2;
    // get price info
    const ticker = yield thisExchange.fetchTicker(pair);
    const price = (ticker.bid + ticker.ask) / 2.0;
    // get minimum purchase size (overestimated)
    const minTradeUnit1 = (ticker.info.MinimumTrade || 0) * MIN_TRADE_OVERSIZE_RATIO;
    const minTradeUnit2 = minTradeUnit1 * price;
    log_1.consoleLog(st, `${EXCHANGE}:: ${amountCoin1} ${COIN1}`);
    log_1.consoleLog(st, `${EXCHANGE}:: ${amountCoin2} ${COIN2}`);
    log_1.consoleLog(st, `${EXCHANGE}:: ${price} ${pair}`);
    // consoleLog(st, 'balance1:', JSON.stringify(balance[COIN1], null, 2))
    // consoleLog(st, 'balance2:', JSON.stringify(balance[COIN2], null, 2))
    // consoleLog(st, 'ticker:', JSON.stringify(ticker, null, 2))
    // consoleLog(st, `min trade = ${minTradeUnit1} ${COIN1} or ${minTradeUnit2} ${COIN2}`)
    const isBuy = TYPE === 'buy';
    const isSell = TYPE === 'sell';
    /* --------------------------------- buying --------------------------------- */
    if (isBuy) {
        const isEnoughAvailable = amountCoin2 > minTradeUnit2;
        if (isEnoughAvailable) {
            const orderSize = lodash_1.default.floor(amountCoin2 / price * UNDERSIZE_RATIO, 8);
            log_1.consoleLog(st, `${EXCHANGE}:: Placing market buy for`, orderSize, COIN1, 'with', COIN2);
            try {
                const res = yield thisExchange.createMarketBuyOrder(pair, orderSize);
                log_1.consoleLog(st, `${EXCHANGE}:: Done. Bought ${res.filled} ${COIN1} for ${res.cost} ${COIN2}` +
                    ` at ${res.average} ${res.symbol} paying ${res.fee.cost} ${res.fee.currency} fee.`);
                // account for changes
                st.coins[COIN1] += res.filled;
                st.coins[COIN2] -= res.cost;
            }
            catch (e) {
                console.warn(`${EXCHANGE}:: ${e.name}`);
            }
        }
        else {
            log_1.consoleLog(st, `${EXCHANGE}:: min trade amount is ${minTradeUnit2} ${COIN2} but only ${amountCoin2} ${COIN2} available `);
        }
    }
    /* --------------------------------- selling -------------------------------- */
    if (isSell) {
        const isEnoughAvailable = amountCoin1 > minTradeUnit1;
        if (isEnoughAvailable) {
            const orderSize = lodash_1.default.floor(amountCoin1 * UNDERSIZE_RATIO, 8);
            log_1.consoleLog(st, `${EXCHANGE}:: Placing market sell for`, pair, 'in amount of', orderSize, COIN1);
            try {
                const res = yield thisExchange.createMarketSellOrder(pair, orderSize);
                log_1.consoleLog(st, `${EXCHANGE}:: Done. Sold ${res.filled} ${COIN1} for ${res.cost} ${COIN2} ` +
                    `at ${res.average} ${res.symbol} paying ${res.fee.cost} ${res.fee.currency} fee.`);
                st.coins[COIN1] -= res.filled;
                st.coins[COIN2] += res.cost;
            }
            catch (e) {
                console.warn(`${EXCHANGE}:: ${e.name}`);
            }
        }
        else {
            log_1.consoleLog(st, `${EXCHANGE}:: min trade amount is ${minTradeUnit1} ${COIN1} but only ${amountCoin1} ${COIN1} available `);
        }
    }
});
//# sourceMappingURL=runBot.js.map