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
const body_parser_1 = __importDefault(require("body-parser"));
// import publicIp from 'public-ip'
const helpers_1 = require("./helpers");
const log_1 = require("./log");
const runBot_1 = require("./runBot");
const app = express_1.default(); // initialize server handler
app.use(body_parser_1.default.text()); // only read text content
const settings = helpers_1.readJSON('settings.json');
// state
const st = {
    log: [],
    coins: {}
};
/* ----------------------------------- app ---------------------------------- */
/**
 * Main server process
 */
const server = () => __awaiter(void 0, void 0, void 0, function* () {
    log_1.consoleLog(st, `Webhook server initializing`);
    // get external ip so I know / not used for now
    // const ip = await publicIp.v4()
    const ip = '___.___.___.___';
    log_1.consoleLog(st, `ip fetched:`, ip);
    // when get api hook request, compare w/ settings and execute order
    app.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const hook = req.body;
        log_1.consoleLog(st, `command received: "${hook}"`);
        // execute each matching CMD
        for (const bot of settings.bots) {
            // if match w/ this bot
            if (bot.CMD === hook)
                yield runBot_1.runBot({ bot, st });
        }
        res.status(200).end();
    }));
    app.get('/', (req, res) => {
        let info = `Get request @ '/'. Public ip: http://${ip}:${settings.port}/\n`;
        info += JSON.stringify(st, null, 2);
        log_1.consoleLog(st, info);
        res.send(info);
    });
    // disable after testing to quick init
    app.get('/buystuff', (req, res) => {
        const info = `Manual request to buy`;
        log_1.consoleLog(st, info);
        res.send(info);
        runBot_1.runBot({ bot: settings.bots[0], st }); // init buy
    });
    app.get('/sellstuff', (req, res) => {
        const info = `Manual request to sell`;
        log_1.consoleLog(st, info);
        res.send(info);
        log_1.consoleLog(st, info);
        res.send(info);
        runBot_1.runBot({ bot: settings.bots[1], st }); // init buy
    });
    app.listen(settings.port, (e) => {
        if (e)
            log_1.consoleLog(st, `Error listening on port ${settings.port}`);
        else
            log_1.consoleLog(st, `Listening on http://localhost:${settings.port}/ & public: http://${ip}:${settings.port}/\n`);
    });
});
// launch the above if settings file found
if (settings)
    server();
else
    log_1.consoleLog(st, `No settings.json found in root folder`);
/* ------------------------------ small helpers ----------------------------- */
log_1.consoleLog(st, `server.ts finished executing`);
// base is coin1
// quote is coin2
// http 80 https 443
//# sourceMappingURL=server.js.map