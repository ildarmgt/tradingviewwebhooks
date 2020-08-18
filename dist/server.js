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
const helpers_1 = require("./helpers");
const runBot_1 = require("./runBot");
const app = express_1.default(); // initialize server handler
app.use(body_parser_1.default.text()); // only read text content
const settings = helpers_1.readJSON('settings.json');
const st = {};
/* ----------------------------------- app ---------------------------------- */
/**
 * Main server process
 */
const server = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`${helpers_1.dateit()} Webhook server initializing`);
    // get external ip so I know
    // const ip = await publicIp.v4()
    const ip = 'localhost'; // temp replace slow step
    console.log(`${helpers_1.dateit()} ip fetched:`, ip);
    // when get api hook request, compare w/ settings and execute order
    app.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const hook = req.body;
        console.log(`${helpers_1.dateit()} command received: "${hook}"`);
        // execute each matching CMD
        for (const bot of settings.bots) {
            // if match w/ this bot
            if (bot.CMD === hook)
                yield runBot_1.runBot({ bot, st });
        }
        res.status(200).end();
    }));
    app.get('/', (req, res) => {
        const info = `${helpers_1.dateit()} Get request @ '/'. Public ip: http://${ip}:${settings.port}/\n` + JSON.stringify(st, null, 2);
        console.log(info);
        res.send(info);
    });
    // disable after testing to quick init
    app.get('/initbuy0', (req, res) => {
        const info = `${helpers_1.dateit()} Get request @ '/initbuy0'. Public ip: http://${ip}:${settings.port}/initbuy0\n`;
        console.log(info);
        res.send(info);
        runBot_1.runBot({ bot: settings.bots[0], st }); // init buy
    });
    app.listen(settings.port, (e) => {
        if (e)
            console.log(`Error listening on port ${settings.port}`);
        else
            console.log(`${helpers_1.dateit()} Listening on http://localhost:${settings.port}/ & public: http://${ip}:${settings.port}/\n`);
    });
});
if (settings)
    server();
else
    console.log(`${helpers_1.dateit()} No settings.json found in root folder`);
/* ------------------------------ small helpers ----------------------------- */
console.log(`${helpers_1.dateit()} server.ts finished executing`);
// base is coin1
// quote is coin2
// http 80 https 443
//# sourceMappingURL=server.js.map