"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dateit = exports.readJSON = void 0;
const fs_1 = __importDefault(require("fs"));
exports.readJSON = (path) => {
    try {
        const res = fs_1.default.readFileSync(path).toString();
        return JSON.parse(res);
    }
    catch (e) {
        return {};
    }
};
exports.dateit = () => `${new Date().toISOString()}::`;
//# sourceMappingURL=helpers.js.map