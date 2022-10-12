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
Object.defineProperty(exports, "__esModule", { value: true });
exports.message = exports.reply = exports.tryTo = exports.remitFactory = exports.toOptionsHash = void 0;
const framework_1 = require("@inceptjs/framework");
const discord_interactions_1 = require("discord-interactions");
const toOptionsHash = function (optionsArray) {
    const options = {};
    optionsArray.forEach(option => (options[option.name] = option.value));
    return options;
};
exports.toOptionsHash = toOptionsHash;
const remitFactory = function (emitter) {
    return function (event, request, response = null) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(request instanceof framework_1.Request)) {
                const params = request;
                request = new framework_1.Request();
                request.params = params;
            }
            if (!(response instanceof framework_1.Response)) {
                response = new framework_1.Response();
            }
            yield emitter.emit(event, request, response);
            const body = yield response.json();
            if (body === null || body === void 0 ? void 0 : body.error) {
                throw framework_1.Exception.for(body.message);
            }
            return body.results;
        });
    };
};
exports.remitFactory = remitFactory;
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
    return res.send((0, exports.message)(content, ephemeral));
};
exports.reply = reply;
const message = (content, ephemeral = true) => {
    return {
        type: discord_interactions_1.InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content, ephemeral }
    };
};
exports.message = message;
