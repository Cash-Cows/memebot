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
const web3 = new utils_1.Web3();
utils_1.emitter.on('discord-commands', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield utils_1.discord.put(`/applications/${utils_1.env.discordApplicationId}/guilds/${utils_1.env.discordGuildId}/commands`, utils_1.commands);
    res.write({ error: false, results: 'commands have been registered' });
}));
utils_1.emitter.on('discord-meme-start', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const sessionURL = 'https://www.wearecashcows.com/memebot.html';
    res.write({
        error: false,
        results: `Before you start generating memes, you need to first connect your wallet and load some $MILK. ${sessionURL}`
    });
}));
utils_1.emitter.on('discord-meme-register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { interaction } = req.params;
    const options = (0, utils_1.toOptionsHash)(interaction.data.options);
    const address = yield (0, utils_1.tryTo)(() => {
        return web3.eth.accounts.recover(web3.utils.sha3(web3.utils.toHex('cashcowsmoo'), { encoding: 'hex' }), options.proof);
    });
    if (!address || address.toLowerCase() !== options.wallet.toLowerCase()) {
        return res.write({ error: true, message: 'Invalid verification.' });
    }
    const params = {
        walletAddress: options.wallet,
        discordId: interaction.member.user.id,
        images: [options.image1]
    };
    if (options.image2) {
        params.images.push(options.image2);
    }
    if (options.image3) {
        params.images.push(options.image3);
    }
    res.write({
        error: false,
        results: `Registering ${interaction.member.user.username}...`
    });
    (0, utils_1.tryTo)(() => (0, utils_1.remit)('consumer-upsert', params))
        .then(() => utils_1.discord.post(`/webhooks/${interaction.application_id}/${interaction.token}`, (0, utils_1.message)(`${interaction.member.user.username} successfully registered!`).data))
        .catch(error => utils_1.discord.post(`/webhooks/${interaction.application_id}/${interaction.token}`, (0, utils_1.message)(error.message).data));
}));
utils_1.emitter.on('discord-meme', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { interaction } = req.params;
    res.write({
        error: false,
        results: `Generating "${interaction.data.options[0].value}" for ${interaction.member.user.username}. This might take a few min...`
    });
    const makeRecurse = (consumer) => {
        const recurse = function () {
            return __awaiter(this, void 0, void 0, function* () {
                const sources = yield (0, utils_1.remit)('source-search', params);
                if (!sources.length) {
                    return `Sorry ${interaction.member.user.username}, no more results for "${interaction.data.options[0].value}".`;
                }
                for (const source of sources) {
                    if (!Array.isArray(source.data) || !source.data.length) {
                        continue;
                    }
                    try {
                        const results = yield (0, utils_1.remit)('meme-generate', { consumer, source });
                        return results.url;
                    }
                    catch (e) {
                        if (e instanceof Error && e.message === 'Not enough balance') {
                            return 'Not enough balance';
                        }
                    }
                }
                params.start++;
                return yield recurse();
            });
        };
        return recurse;
    };
    const options = (0, utils_1.toOptionsHash)(interaction.data.options);
    const params = { q: options.query, range: 1 };
    params.start = parseInt(options.next || '0');
    (0, utils_1.remit)('consumer-detail', {
        discordId: interaction.member.user.id
    })
        .then(consumer => {
        const recurse = makeRecurse(consumer);
        (0, utils_1.tryTo)(() => __awaiter(void 0, void 0, void 0, function* () { return yield recurse(); }))
            .then(content => utils_1.discord.post(`/webhooks/${interaction.application_id}/${interaction.token}`, (0, utils_1.message)(content).data))
            .catch(error => utils_1.discord.post(`/webhooks/${interaction.application_id}/${interaction.token}`, (0, utils_1.message)(error.message).data));
    });
}));
