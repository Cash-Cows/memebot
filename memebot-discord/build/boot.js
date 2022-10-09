"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractionResponseType = exports.InteractionType = exports.verify = exports.commands = exports.guildId = exports.applicationId = exports.discord = exports.axios = exports.app = void 0;
const axios_1 = __importDefault(require("axios"));
exports.axios = axios_1.default;
const express_1 = __importDefault(require("express"));
const discord_interactions_1 = require("discord-interactions");
Object.defineProperty(exports, "InteractionType", { enumerable: true, get: function () { return discord_interactions_1.InteractionType; } });
Object.defineProperty(exports, "InteractionResponseType", { enumerable: true, get: function () { return discord_interactions_1.InteractionResponseType; } });
const dotenv_1 = __importDefault(require("dotenv"));
const commands_json_1 = __importDefault(require("./commands.json"));
exports.commands = commands_json_1.default;
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
    baseURL: 'https://discord.com/api/',
    timeout: 3000,
    headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Authorization',
        'Authorization': `Bot ${tokenId}`
    }
});
exports.discord = discord;
