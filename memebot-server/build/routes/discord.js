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
const utils_1 = require("../utils");
utils_1.app.post('/interactions', utils_1.verify, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const interaction = req.body;
    if (interaction.type !== utils_1.InteractionType.APPLICATION_COMMAND) {
        return (0, utils_1.reply)(res, 'Not sure');
    }
    (0, utils_1.remit)(`discord-${interaction.data.name}`, { interaction })
        .then(results => (0, utils_1.reply)(res, results))
        .catch(error => (0, utils_1.reply)(res, error.message));
}));
utils_1.app.get('/discord/register_commands', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    (0, utils_1.remit)('discord-commands', {})
        .then(results => res.json({ error: false, results }))
        .catch(error => res.json({ error: true, message: error.message }));
}));
