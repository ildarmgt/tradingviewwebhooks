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
exports.logToCSV = exports.consoleLog = void 0;
const fs_1 = __importDefault(require("fs"));
const csv_write_stream_1 = __importDefault(require("csv-write-stream"));
const helpers_1 = require("./helpers");
// display and log events
exports.consoleLog = (st, ...args) => {
    const res = [helpers_1.dateit(), ...args].join(' ');
    console.log(res);
    st.log.push(res);
    exports.logToCSV(st);
};
// write to csv file
exports.logToCSV = (st) => __awaiter(void 0, void 0, void 0, function* () {
    const FILE_PATH = 'logs/output.csv';
    // create header if necessary
    try {
        let writer = csv_write_stream_1.default();
        if (!fs_1.default.existsSync(FILE_PATH)) {
            writer = csv_write_stream_1.default({
                headers: ['timestamp', 'entry']
            });
        }
        else {
            writer = csv_write_stream_1.default({ sendHeaders: false });
        }
        // add lines to file
        writer.pipe(fs_1.default.createWriteStream(FILE_PATH, { flags: 'a' }));
        while (st.log.length > 0) {
            const entry = st.log.shift();
            if (entry === undefined)
                break;
            writer.write({
                timestamp: Date.now(),
                entry
            });
        }
        // close file
        writer.end();
    }
    catch (e) {
        console.warn(e);
    }
});
//# sourceMappingURL=log.js.map