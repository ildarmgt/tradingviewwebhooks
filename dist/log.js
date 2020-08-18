"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consoleLog = void 0;
const helpers_1 = require("./helpers");
// display and log events
exports.consoleLog = (st, ...args) => {
    const res = [helpers_1.dateit(), ...args].join(' ');
    console.log(res);
    st.log.push(res);
};
//# sourceMappingURL=log.js.map