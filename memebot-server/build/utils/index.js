"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Prisma = exports.Direction = exports.InteractionType = exports.BigNumber = exports.InceptResponse = exports.InceptRequest = exports.EventEmitter = exports.FaceSmash = exports.Exception = exports.FormData = exports.Readable = exports.Web3 = exports.toOptionsHash = exports.express = exports.message = exports.verify = exports.tryTo = exports.remit = exports.reply = exports.discord = exports.infura = exports.tenor = exports.axios = exports.service = exports.emitter = exports.prisma = exports.app = exports.commands = exports.models = exports.env = void 0;
const path_1 = __importDefault(require("path"));
const stream_1 = require("stream");
Object.defineProperty(exports, "Readable", { enumerable: true, get: function () { return stream_1.Readable; } });
const form_data_1 = __importDefault(require("form-data"));
exports.FormData = form_data_1.default;
const axios_1 = __importDefault(require("axios"));
exports.axios = axios_1.default;
const express_1 = __importDefault(require("express"));
exports.express = express_1.default;
const framework_1 = require("@inceptjs/framework");
Object.defineProperty(exports, "InceptRequest", { enumerable: true, get: function () { return framework_1.Request; } });
Object.defineProperty(exports, "InceptResponse", { enumerable: true, get: function () { return framework_1.Response; } });
Object.defineProperty(exports, "EventEmitter", { enumerable: true, get: function () { return framework_1.EventEmitter; } });
Object.defineProperty(exports, "Exception", { enumerable: true, get: function () { return framework_1.Exception; } });
const discord_interactions_1 = require("discord-interactions");
Object.defineProperty(exports, "InteractionType", { enumerable: true, get: function () { return discord_interactions_1.InteractionType; } });
const dotenv_1 = __importDefault(require("dotenv"));
const web3_1 = __importDefault(require("web3"));
exports.Web3 = web3_1.default;
const FaceSmash_1 = __importDefault(require("./lib/FaceSmash"));
exports.FaceSmash = FaceSmash_1.default;
const ServiceContract_1 = __importStar(require("./lib/ServiceContract"));
Object.defineProperty(exports, "BigNumber", { enumerable: true, get: function () { return ServiceContract_1.BigNumber; } });
const canvas_1 = require("./canvas");
const functions_1 = require("./functions");
Object.defineProperty(exports, "toOptionsHash", { enumerable: true, get: function () { return functions_1.toOptionsHash; } });
Object.defineProperty(exports, "tryTo", { enumerable: true, get: function () { return functions_1.tryTo; } });
Object.defineProperty(exports, "reply", { enumerable: true, get: function () { return functions_1.reply; } });
Object.defineProperty(exports, "message", { enumerable: true, get: function () { return functions_1.message; } });
const prisma_1 = require("./prisma");
Object.defineProperty(exports, "prisma", { enumerable: true, get: function () { return prisma_1.prisma; } });
Object.defineProperty(exports, "Prisma", { enumerable: true, get: function () { return prisma_1.Prisma; } });
const types_1 = require("./types");
Object.defineProperty(exports, "Direction", { enumerable: true, get: function () { return types_1.Direction; } });
const service_json_1 = __importDefault(require("../config/service.json"));
const commands_json_1 = __importDefault(require("../config/commands.json"));
exports.commands = commands_json_1.default;
dotenv_1.default.config();
const { DISCORD_APPLICATION_ID, DISCORD_TOKEN, DISCORD_PUBLIC_KEY, DISCORD_GUILD_ID, INFURA_API_KEY, INFURA_API_SECRET, TENOR_KEY, ADMIN_KEY } = process.env;
const env = {
    discordApplicationId: DISCORD_APPLICATION_ID,
    discordTokenId: DISCORD_TOKEN,
    discordPublicKey: DISCORD_PUBLIC_KEY,
    discordGuildId: DISCORD_GUILD_ID,
    infuraKey: INFURA_API_KEY,
    infuraSecret: INFURA_API_SECRET,
    tenorKey: TENOR_KEY,
    tenorClient: 'tenorcept',
    adminKey: ADMIN_KEY
};
exports.env = env;
const app = (0, express_1.default)();
exports.app = app;
const emitter = new framework_1.EventEmitter();
exports.emitter = emitter;
const models = path_1.default.resolve(__dirname, '../../models');
exports.models = models;
(0, canvas_1.loadTF)().then(_ => FaceSmash_1.default.loadModels(models));
const service = ServiceContract_1.default.load(env.adminKey, service_json_1.default);
exports.service = service;
const discord = axios_1.default.create({
    baseURL: 'https://discord.com/api',
    timeout: 3600,
    headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Authorization',
        'Authorization': `Bot ${env.discordTokenId}`
    }
});
exports.discord = discord;
const tenor = axios_1.default.create({
    baseURL: 'https://tenor.googleapis.com/v2'
});
exports.tenor = tenor;
const infura = axios_1.default.create({
    baseURL: 'https://ipfs.infura.io:5001/api/v0'
});
exports.infura = infura;
const verify = (0, discord_interactions_1.verifyKeyMiddleware)(env.discordPublicKey);
exports.verify = verify;
const remit = (0, functions_1.remitFactory)(emitter);
exports.remit = remit;
