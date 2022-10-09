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
const boot_1 = require("./boot");
const events_1 = __importDefault(require("events"));
const emitter = new events_1.default();
emitter.on('commands', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield boot_1.axios.put(`/applications/${boot_1.applicationId}/guilds/${boot_1.guildId}/commands`, boot_1.commands);
            return res.send('commands have been registered');
        }
        catch (e) {
            console.error(e);
            return res.send('500 error from discord');
        }
    });
});
emitter.on('meme', function (req, res, interaction) {
    res.send({
        type: boot_1.InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: `Yo ${interaction.member.user.username}!`,
        },
    });
});
exports.default = emitter;
