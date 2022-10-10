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
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const service_json_1 = __importDefault(require("./service.json"));
const GifFaces_1 = __importDefault(require("./lib/GifFaces"));
const ServiceContract_1 = __importStar(require("./lib/ServiceContract"));
const MemeGenerator_1 = __importDefault(require("./lib/MemeGenerator"));
const Consumer_1 = __importDefault(require("./lib/Consumer"));
const types_1 = require("./utils/types");
const canvas_1 = require("./utils/canvas");
const models = path_1.default.resolve(__dirname, '../models');
(0, canvas_1.loadTF)().then(_ => GifFaces_1.default.loadModels(models));
const app = (0, express_1.default)();
const service = ServiceContract_1.default.load(process.env.ADMIN_KEY, service_json_1.default);
app.use(express_1.default.static(path_1.default.resolve(__dirname, '../public')));
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send('Want some memes?');
}));
app.get('/api/ping', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.json({ error: false, results: 'pong' });
}));
app.get('/api/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    Consumer_1.default.register(walletAddress, discordId, images)
        .then(results => res.json({ error: false, results }))
        .catch(error => res.json({ error: true, message: error.message }));
}));
app.get('/api/user', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _d, _e, _f;
    if (!((_d = req.query) === null || _d === void 0 ? void 0 : _d.wallet) && !((_e = req.query) === null || _e === void 0 ? void 0 : _e.discordId)) {
        return res.json({ error: true, message: 'Wallet address missing' });
    }
    let key;
    let id;
    if ((_f = req.query) === null || _f === void 0 ? void 0 : _f.wallet) {
        key = 'walletAddress';
        id = String(req.query.wallet);
    }
    else {
        key = 'discordId';
        id = String(req.query.discordId);
    }
    Consumer_1.default.getWithBalance(id, key, service)
        .then(results => res.json({ error: false, results }))
        .catch(error => res.json({ error: true, message: error.message }));
}));
app.get('/api/search', (req, res) => {
    var _a;
    if (!((_a = req.query) === null || _a === void 0 ? void 0 : _a.q))
        return res.json({
            error: true,
            message: 'Query missing'
        });
    MemeGenerator_1.default.search(req.query)
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
app.get('/api/detect', (req, res) => {
    var _a;
    if (!((_a = req.query) === null || _a === void 0 ? void 0 : _a.url)) {
        return res.json({ error: true, message: 'URL missing' });
    }
    else if (!GifFaces_1.default.modelsAreLoaded(models)) {
        return res.json({ error: true, message: 'AI still loading' });
    }
    MemeGenerator_1.default.detect(req.query.url)
        .then(results => res.json({ error: false, results }))
        .catch(error => res.json({ error: true, message: error.message }));
});
app.get('/api/generate', (req, res) => {
    var _a, _b;
    if (typeof ((_a = req.query) === null || _a === void 0 ? void 0 : _a.key) !== 'string') {
        return res.json({ error: true, message: 'API key missing' });
    }
    else if (typeof ((_b = req.query) === null || _b === void 0 ? void 0 : _b.url) !== 'string') {
        return res.json({ error: true, message: 'URL missing' });
    }
    const walletAddress = req.query.key;
    MemeGenerator_1.default.generate(walletAddress, req.query.url, service)
        .then(results => res.json({ error: false, results }))
        .catch(error => res.json({ error: true, message: error.message }));
});
app.get('/api/vote/up', (req, res) => {
    var _a;
    if (!((_a = req.query) === null || _a === void 0 ? void 0 : _a.url)) {
        return res.json({ error: true, message: 'URL missing' });
    }
    const url = req.query.url;
    MemeGenerator_1.default.vote(url, types_1.Direction.Up)
        .then(results => res.json({ error: false, results }))
        .catch(error => res.json({ error: true, message: error.message }));
});
app.get('/api/vote/down', (req, res) => {
    var _a;
    if (!((_a = req.query) === null || _a === void 0 ? void 0 : _a.url)) {
        return res.json({ error: true, message: 'URL missing' });
    }
    const url = req.query.url;
    MemeGenerator_1.default.vote(url, types_1.Direction.Down)
        .then((results) => __awaiter(void 0, void 0, void 0, function* () {
        if (!results.up && results.down === 10) {
            const consumer = yield Consumer_1.default.getOrThrow(results.consumerId);
            const consumed = ServiceContract_1.BigNumber
                .from(consumer.consumed)
                .sub(service.rate)
                .toString();
            yield Consumer_1.default.consume(consumer.walletAddress, parseInt(consumed) > 0 ? consumed : '0');
        }
        res.json({ error: false, results });
    }))
        .catch(error => res.json({ error: true, message: error.message }));
});
app.get('/api/discord/search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _g, _h;
    if (!((_g = req.query) === null || _g === void 0 ? void 0 : _g.q)) {
        return res.json({ error: true, message: 'Query missing' });
    }
    else if (!((_h = req.query) === null || _h === void 0 ? void 0 : _h.key)) {
        return res.json({ error: true, message: 'API Key missing' });
    }
    const query = req.query.q;
    const skip = parseInt(req.query.skip || '0') || 0;
    const id = req.query.key;
    const key = id.indexOf('0x') === 0 ? 'walletAddress' : 'discordId';
    let consumer;
    try {
        consumer = yield Consumer_1.default.getWithBalance(id, key, service);
    }
    catch (error) {
        return res.json({ error: true, message: 'Invalid API Key' });
    }
    MemeGenerator_1.default.generateOne(consumer, query, service, skip)
        .then(results => res.json({ error: false, results }))
        .catch(error => res.json({ error: true, message: error.message }));
}));
exports.default = app;
