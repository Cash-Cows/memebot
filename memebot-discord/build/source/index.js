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
const events_1 = __importDefault(require("./events"));
boot_1.app.post('/interactions', boot_1.verify, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const interaction = req.body;
    if (interaction.type === boot_1.InteractionType.APPLICATION_COMMAND) {
        events_1.default.emit(interaction.data.name, req, res, interaction);
    }
}));
boot_1.app.get('/register_commands', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    events_1.default.emit('commands', req, res);
}));
boot_1.app.get('/', (req, res) => res.send('Want some memes?'));
boot_1.app.listen(8999, () => { });
