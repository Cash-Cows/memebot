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
utils_1.app.get('/api/ping', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.json({ error: false, results: 'pong' });
}));
utils_1.app.get('/api/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    if (!((_a = req.query) === null || _a === void 0 ? void 0 : _a.wallet)) {
        return res.json({ error: true, message: 'Wallet address missing' });
    }
    else if (!((_b = req.query) === null || _b === void 0 ? void 0 : _b.image)) {
        return res.json({ error: true, message: 'Images missing' });
    }
    else if (!((_c = req.query) === null || _c === void 0 ? void 0 : _c.discordId)) {
        return res.json({ error: true, message: 'Discord ID missing' });
    }
    const images = Array.isArray(req.query.image)
        ? req.query.image
        : [req.query.image];
    const walletAddress = String(req.query.wallet);
    const discordId = String(req.query.discordId);
    (0, utils_1.remit)('consumer-upsert', { walletAddress, discordId, images })
        .then(results => res.json({ error: false, results }))
        .catch(error => res.json({ error: true, message: error.message }));
}));
utils_1.app.get('/api/user', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _d, _e, _f;
    if (!((_d = req.query) === null || _d === void 0 ? void 0 : _d.id) && !((_e = req.query) === null || _e === void 0 ? void 0 : _e.wallet) && !((_f = req.query) === null || _f === void 0 ? void 0 : _f.discordId)) {
        return res.json({ error: true, message: 'Wallet address missing' });
    }
    if (req.query.wallet) {
        req.query.walletAddress = req.query.wallet;
    }
    (0, utils_1.remit)('consumer-detail', req.query)
        .then(results => res.json({ error: false, results }))
        .catch(error => res.json({ error: true, message: error.message }));
}));
utils_1.app.get('/api/search', (req, res) => {
    var _a;
    if (!((_a = req.query) === null || _a === void 0 ? void 0 : _a.q))
        return res.json({
            error: true,
            message: 'Query missing'
        });
    (0, utils_1.remit)('meme-search-tenor', { query: req.query })
        .then(search => {
        const response = search.response;
        res.json({
            error: false,
            results: response.results,
            next: response.next
        });
    })
        .catch(error => res.json({ error: true, message: error.message }));
});
utils_1.app.get('/api/detect', (req, res) => {
    var _a;
    if (!((_a = req.query) === null || _a === void 0 ? void 0 : _a.url)) {
        return res.json({ error: true, message: 'URL missing' });
    }
    else if (!utils_1.FaceSmash.modelsAreLoaded(utils_1.models)) {
        return res.json({ error: true, message: 'AI still loading' });
    }
    (0, utils_1.remit)('source-detect-faces', { source: req.query.url })
        .then(results => res.json({ error: false, results }))
        .catch(error => res.json({ error: true, message: error.message }));
});
utils_1.app.get('/api/generate', (req, res) => {
    var _a, _b;
    if (typeof ((_a = req.query) === null || _a === void 0 ? void 0 : _a.key) !== 'string') {
        return res.json({ error: true, message: 'API key missing' });
    }
    else if (typeof ((_b = req.query) === null || _b === void 0 ? void 0 : _b.url) !== 'string') {
        return res.json({ error: true, message: 'URL missing' });
    }
    const walletAddress = req.query.key;
    (0, utils_1.remit)('meme-generate', {
        source: req.query.url,
        consumer: walletAddress
    })
        .then(results => res.json({ error: false, results }))
        .catch(error => {
        console.log(error);
        res.json({ error: true, message: error.message });
    });
});
utils_1.app.get('/api/vote/up', (req, res) => {
    var _a;
    if (!((_a = req.query) === null || _a === void 0 ? void 0 : _a.url)) {
        return res.json({ error: true, message: 'URL missing' });
    }
    const url = req.query.url;
    (0, utils_1.remit)('meme-vote', { url, direction: utils_1.Direction.Up })
        .then(results => res.json({ error: false, results }))
        .catch(error => res.json({ error: true, message: error.message }));
});
utils_1.app.get('/api/vote/down', (req, res) => {
    var _a;
    if (!((_a = req.query) === null || _a === void 0 ? void 0 : _a.url)) {
        return res.json({ error: true, message: 'URL missing' });
    }
    const url = req.query.url;
    (0, utils_1.remit)('meme-vote', { url, direction: utils_1.Direction.Down })
        .then((results) => __awaiter(void 0, void 0, void 0, function* () {
        if (!results.up && results.down === 10) {
            const consumer = yield (0, utils_1.remit)('consumer-detail', {
                id: results.consumerId
            });
            yield (0, utils_1.remit)('consumer-upsert', {
                walletAddress: consumer.walletAddress,
                consumed: utils_1.BigNumber
                    .from(consumer.consumed)
                    .sub(utils_1.service.rate)
                    .toString()
            });
        }
        res.json({ error: false, results });
    }))
        .catch(error => res.json({ error: true, message: error.message }));
});
