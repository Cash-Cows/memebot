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
const web3 = new boot_1.Web3();
emitter.on('commands', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield boot_1.discord.put(`/applications/${boot_1.applicationId}/guilds/${boot_1.guildId}/commands`, boot_1.commands);
            return res.send('commands have been registered');
        }
        catch (e) {
            console.error(e);
            return res.send('500 error from discord');
        }
    });
});
emitter.on('meme-register', function (req, res, interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = (0, boot_1.toOptionsHash)(interaction.data.options);
        const address = yield (0, boot_1.tryTo)(() => {
            return web3.eth.accounts.recover(web3.utils.sha3(web3.utils.toHex('cashcowsmoo'), { encoding: 'hex' }), options.proof);
        });
        if (!address || address.toLowerCase() !== options.wallet.toLowerCase()) {
            return (0, boot_1.reply)(res, 'Invalid verification.');
        }
        const params = new URLSearchParams();
        params.append('wallet', options.wallet);
        params.append('discordId', interaction.member.user.id);
        params.append('image', options.image1);
        if (options.image2) {
            params.append('image', options.image2);
        }
        if (options.image3) {
            params.append('image', options.image3);
        }
        (0, boot_1.reply)(res, `Registering ${interaction.member.user.username}...`);
        const response = yield (0, boot_1.tryTo)(() => __awaiter(this, void 0, void 0, function* () {
            return yield boot_1.api.get(`/register?${params.toString()}`);
        }));
        if (!response) {
            return yield (0, boot_1.tryTo)(() => __awaiter(this, void 0, void 0, function* () {
                return yield boot_1.discord.post(`/webhooks/${interaction.application_id}/${interaction.token}`, (0, boot_1.message)(`Sorry ${interaction.member.user.username}, server looks to be down now.`).data);
            }));
        }
        else if (response.error) {
            return yield (0, boot_1.tryTo)(() => __awaiter(this, void 0, void 0, function* () {
                return yield boot_1.discord.post(`/webhooks/${interaction.application_id}/${interaction.token}`, (0, boot_1.message)(response.message).data);
            }));
        }
        yield (0, boot_1.tryTo)(() => __awaiter(this, void 0, void 0, function* () {
            return yield boot_1.discord.post(`/webhooks/${interaction.application_id}/${interaction.token}`, (0, boot_1.message)(`${interaction.member.user.username} successfully registered!`).data);
        }));
    });
});
emitter.on('meme-start', function (req, res, interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        const sessionURL = 'https://www.wearecashcows.com/memebot.html';
        return (0, boot_1.reply)(res, `Before you start generating memes, you need to first connect your wallet and load some $MILK. ${sessionURL}`);
    });
});
emitter.on('meme', function (req, res, interaction) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        (0, boot_1.reply)(res, `Generating "${interaction.data.options[0].value}" for ${interaction.member.user.username}. This might take a few min...`);
        const options = (0, boot_1.toOptionsHash)(interaction.data.options);
        const params = new URLSearchParams();
        params.append('q', options.query);
        params.append('key', interaction.member.user.id);
        if (options.next) {
            params.append('skip', options.next);
        }
        const response = yield (0, boot_1.tryTo)(() => __awaiter(this, void 0, void 0, function* () {
            return yield boot_1.api.get(`/discord/search?${params.toString()}`);
        }));
        if (!response.data) {
            return yield (0, boot_1.tryTo)(() => __awaiter(this, void 0, void 0, function* () {
                return yield boot_1.discord.post(`/webhooks/${interaction.application_id}/${interaction.token}`, (0, boot_1.message)(`Sorry ${interaction.member.user.username}, server looks to be down now.`).data);
            }));
        }
        else if (response.data.error) {
            return yield (0, boot_1.tryTo)(() => __awaiter(this, void 0, void 0, function* () {
                return yield boot_1.discord.post(`/webhooks/${interaction.application_id}/${interaction.token}`, (0, boot_1.message)(response.data.message).data);
            }));
        }
        else if (!((_a = response.data.results) === null || _a === void 0 ? void 0 : _a.url)) {
            return yield (0, boot_1.tryTo)(() => __awaiter(this, void 0, void 0, function* () {
                return yield boot_1.discord.post(`/webhooks/${interaction.application_id}/${interaction.token}`, (0, boot_1.message)(`Sorry ${interaction.member.user.username}, no more results for "${interaction.data.options[0].value}".`).data);
            }));
        }
        yield (0, boot_1.tryTo)(() => __awaiter(this, void 0, void 0, function* () {
            return yield boot_1.discord.post(`/webhooks/${interaction.application_id}/${interaction.token}`, (0, boot_1.message)(response.data.results.url).data);
        }));
    });
});
exports.default = emitter;
