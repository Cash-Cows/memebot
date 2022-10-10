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
exports.InteractionResponseType = exports.InteractionType = exports.Web3 = exports.toOptionsHash = exports.tryTo = exports.message = exports.reply = exports.verify = exports.services = exports.commands = exports.guildId = exports.applicationId = exports.discord = exports.axios = exports.app = exports.api = void 0;
const axios_1 = __importDefault(require("axios"));
exports.axios = axios_1.default;
const express_1 = __importDefault(require("express"));
const discord_interactions_1 = require("discord-interactions");
Object.defineProperty(exports, "InteractionType", { enumerable: true, get: function () { return discord_interactions_1.InteractionType; } });
Object.defineProperty(exports, "InteractionResponseType", { enumerable: true, get: function () { return discord_interactions_1.InteractionResponseType; } });
const dotenv_1 = __importDefault(require("dotenv"));
const web3_1 = __importDefault(require("web3"));
exports.Web3 = web3_1.default;
const commands_json_1 = __importDefault(require("../config/commands.json"));
exports.commands = commands_json_1.default;
const services_json_1 = __importDefault(require("../config/services.json"));
exports.services = services_json_1.default;
dotenv_1.default.config();
const { APPLICATION_ID, TOKEN, PUBLIC_KEY, GUILD_ID } = process.env;
const applicationId = APPLICATION_ID;
exports.applicationId = applicationId;
const tokenId = TOKEN;
const publicKey = PUBLIC_KEY;
const guildId = GUILD_ID;
exports.guildId = guildId;
const app = (0, express_1.default)();
exports.app = app;
const verify = (0, discord_interactions_1.verifyKeyMiddleware)(publicKey);
exports.verify = verify;
const discord = axios_1.default.create({
    baseURL: 'https://discord.com/api',
    timeout: 3600,
    headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Authorization',
        'Authorization': `Bot ${tokenId}`
    }
});
exports.discord = discord;
const api = axios_1.default.create({
    baseURL: 'https://meme-bot.onrender.com/api'
});
exports.api = api;
const toOptionsHash = function (optionsArray) {
    const options = {};
    optionsArray.forEach(option => (options[option.name] = option.value));
    return options;
};
exports.toOptionsHash = toOptionsHash;
const tryTo = function (callback) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield callback();
        }
        catch (e) {
            return null;
        }
    });
};
exports.tryTo = tryTo;
const reply = (res, content, ephemeral = true) => {
    return res.send(message(content, ephemeral));
};
exports.reply = reply;
const message = (content, ephemeral = true) => {
    return {
        type: discord_interactions_1.InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content, ephemeral }
    };
};
exports.message = message;
