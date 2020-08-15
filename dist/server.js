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
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const ccxt_1 = __importDefault(require("ccxt"));
const lodash_1 = __importDefault(require("lodash"));
const app = express_1.default();
const settings = readJSON('settings.json');
/* ----------------------------------- app ---------------------------------- */
const server = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('webhook server initializing');
    // get external ip so I know
    const ip = 'localhost'; // await publicIp.v4()
    console.log('ip fetched:', ip);
    // when get api hook request, compare w/ settings and execute order
    app.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const hook = req.body;
        console.log(`${dateit()} post request body: ${hook}`);
        // execute each matching CMD
        for (const bot of settings.bots) {
            // if match w/ this bot
            if (bot.CMD === hook || true)
                yield runBot(bot);
        }
        res.status(200).end();
    }));
    app.get('/', (req, res) => {
        const info = `${dateit()} Get request @ '/'. Public ip: ${ip}:${settings.port}`;
        console.log(info);
        res.send(info);
        runBot(settings.bots[0]);
    });
    app.listen(settings.port, (e) => {
        if (e)
            console.log(`Error listening on port ${settings.port}`);
        else
            console.log(`${dateit()}Listening on localhost:${settings.port}\nPublic IP: ${ip}\n`);
    });
});
if (settings)
    server();
else
    console.log('No settings.json found in root folder');
/* -------------------------------------------------------------------------- */
/*                                   actions                                  */
/* -------------------------------------------------------------------------- */
const runBot = (bot) => __awaiter(void 0, void 0, void 0, function* () {
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
    console.log(`${dateit()} ${EXCHANGE} initialized`);
    // get balances
    const balance = yield thisExchange.fetchBalance();
    const amountCoin1 = balance[COIN1].total;
    const amountCoin2 = balance[COIN2].total;
    // get price info
    const ticker = yield thisExchange.fetchTicker(pair);
    const price = (ticker.bid + ticker.ask) / 2.0;
    // get minimum purchase size (overestimated)
    const minTradeUnit1 = (ticker.info.MinimumTrade || 0) * 1.1;
    const minTradeUnit2 = minTradeUnit1 * price;
    console.log(`${dateit()} ${amountCoin1} ${COIN1}`);
    console.log(`${dateit()} ${amountCoin2} ${COIN2}`);
    console.log(`${dateit()} ${price} ${pair}`);
    console.log('balance1:', JSON.stringify(balance[COIN1], null, 2));
    console.log('balance2:', JSON.stringify(balance[COIN2], null, 2));
    // console.log('ticker:', JSON.stringify(ticker, null, 2))
    // console.log(`min trade = ${minTradeUnit1} ${COIN1} or ${minTradeUnit2} ${COIN2}`)
    const isBuy = TYPE === 'buy';
    const isSell = TYPE === 'sell';
    /* --------------------------------- buying --------------------------------- */
    if (isBuy) {
        const isEnoughAvailable = amountCoin2 > minTradeUnit2;
        if (isEnoughAvailable) {
            console.log('Placing market buy for', lodash_1.default.floor(amountCoin2 / price * 0.99, 8), COIN1, 'with', COIN2);
            try {
                const res = yield thisExchange.createMarketBuyOrder(pair, lodash_1.default.floor(amountCoin2 / price * 0.99, 8));
                // console.log('res:', JSON.stringify(res, null, 2))
                console.log(`Done. Bought ${res.filled} ${COIN1} for ${res.cost} ${COIN2} at ${res.average} ${res.symbol} paying ${res
                    .fee.cost} ${res.fee.currency} fee.`);
            }
            catch (e) {
                console.warn(e.name);
            }
        }
        else {
            console.log(`min trade amount is ${minTradeUnit2} ${COIN2} but only ${amountCoin2} ${COIN2} available `);
        }
    }
    /* --------------------------------- selling -------------------------------- */
    if (isSell) {
        const isEnoughAvailable = amountCoin1 > minTradeUnit1;
        if (isEnoughAvailable) {
            console.log('Placing market sell for', pair, 'in amount of', lodash_1.default.floor(amountCoin1 * 0.99, 8), COIN1);
            try {
                const res = yield thisExchange.createMarketSellOrder(pair, lodash_1.default.floor(amountCoin1 * 0.99, 8));
                // console.log('res:', JSON.stringify(res, null, 2))
                // res.info.fills is an array of { qty = coin1 sold, price = price sold at, fee.cost = fee, fee.currency = fee unit, tradeId }
                // or overall res.filled and res.cost and res.price useful
                console.log(`Done. Sold ${res.filled} ${COIN1} for ${res.cost} ${COIN2} at ${res.average} ${res.symbol} paying ${res
                    .fee.cost} ${res.fee.currency} fee.`);
            }
            catch (e) {
                console.warn(e.name);
            }
        }
        else {
            console.log(`min trade amount is ${minTradeUnit1} ${COIN1} but only ${amountCoin1} ${COIN1} available `);
        }
    }
});
/* --------------------------------- helper --------------------------------- */
function readJSON(path) {
    try {
        const res = fs_1.default.readFileSync(path).toString();
        return JSON.parse(res);
    }
    catch (e) {
        return {};
    }
}
function dateit() {
    return `\n${new Date().toISOString()}::`;
}
// base is coin1
// quote is coin2
//# sourceMappingURL=server.js.map