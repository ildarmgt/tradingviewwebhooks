"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const app = express_1.default();
const readJSON = (path) => {
    try {
        const res = fs_1.default.readFileSync(path).toString();
        return JSON.parse(res);
    }
    catch (e) {
        return {};
    }
};
const settings = readJSON('settings.json');
console.log(`running listen on port ${settings.port}`);
//# sourceMappingURL=index.js.map