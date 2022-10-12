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
utils_1.emitter.on('meme-cache', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const url = req.params.url;
    const results = req.params.results;
    const rows = [];
    for (const row of results) {
        rows.push({
            description: row.description,
            url: row.url,
            source: url,
            tags: row.tags
        });
    }
    const dupes = (yield utils_1.prisma.source.findMany({
        where: {
            OR: rows.map(row => row.url).map(url => ({ url }))
        }
    })).map(row => row.url);
    const filtered = rows.filter(row => dupes.indexOf(row.url) === -1);
    if (filtered.length) {
        const results = yield utils_1.prisma.source.createMany({ data: filtered });
        res.write({ error: false, results });
    }
    else {
        res.write({ error: false, results: [] });
    }
}));
utils_1.emitter.on('meme-generate', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let consumer = req.params.consumer;
    let source = req.params.source;
    if (typeof consumer === 'string') {
        if (consumer.indexOf('0x') === 0) {
            consumer = (yield (0, utils_1.remit)('consumer-detail', {
                walletAddress: consumer
            }));
        }
        else {
            consumer = (yield (0, utils_1.remit)('consumer-detail', {
                discordId: consumer
            }));
        }
    }
    if (typeof source === 'string') {
        if (source.indexOf('http') === 0) {
            source = (yield (0, utils_1.remit)('source-detail', {
                url: source
            }));
        }
        else {
            source = (yield (0, utils_1.remit)('source-detail', {
                cid: source
            }));
        }
    }
    const exists = yield utils_1.prisma.meme.findFirst({ where: {
            consumerId: consumer.id,
            sourceId: source.id
        } });
    if (exists) {
        return res.write({ error: false, results: exists });
    }
    if (!Array.isArray(consumer.images) || !consumer.images.length) {
        return res.write({ error: true, message: 'Consumer has no images' });
    }
    const totalBalance = yield utils_1.service.balanceOf(consumer.walletAddress);
    if (parseInt(totalBalance
        .sub(utils_1.BigNumber.from(consumer.consumed))
        .sub(utils_1.service.rate)
        .toString()) < 0) {
        throw utils_1.Exception.for('Not enough balance');
    }
    const face = consumer.images[Math.floor(Math.random() * 1000) % consumer.images.length];
    const detections = source.data;
    const animation = yield utils_1.FaceSmash.pasteFaces(source.url, face, detections);
    const form = new utils_1.FormData();
    form.append('file', utils_1.Readable.from(animation.out.getData()), 'meme.gif');
    const response = yield utils_1.infura.post('/add?wrap-with-directory=true', form, {
        headers: Object.assign(Object.assign({}, form.getHeaders()), { authorization: `Basic ${Buffer
                .from(`${utils_1.env.infuraKey}:${utils_1.env.infuraSecret}`)
                .toString('base64')}` })
    });
    const json = JSON.parse(`[${response.data.replace("}\n{", '},{').trim()}]`);
    const file = {
        cid: json[0].Hash,
        path: `/${json[1].Hash}/${json[0].Name}`
    };
    yield (0, utils_1.remit)('consumer-upsert', {
        walletAddress: consumer.walletAddress,
        consumed: utils_1.BigNumber
            .from(consumer.consumed)
            .add(utils_1.service.rate)
            .toString()
    });
    const results = yield utils_1.prisma.meme.create({
        data: {
            description: source.description,
            url: `${utils_1.service.config.ipfs}/ipfs${file.path}`,
            cid: file.cid,
            tags: source.tags || [],
            sourceId: source.id,
            consumerId: consumer.id
        }
    });
    res.write({ error: false, results });
}));
utils_1.emitter.on('meme-search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { q, start, range } = req.params;
    const where = {};
    if (q) {
        where.OR = [
            { description: { contains: q } },
            { tags: { array_contains: [q] } }
        ];
    }
    const results = yield utils_1.prisma.meme.findMany({
        where,
        skip: start,
        take: range
    });
    res.write({ error: false, results });
}));
utils_1.emitter.on('meme-search-tenor', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const params = new URLSearchParams(Object.assign(Object.assign({ limit: '50' }, req.params.query), {
        client_key: utils_1.env.tenorClient,
        key: utils_1.env.tenorKey
    }));
    const url = `https://tenor.googleapis.com/v2/search?${params.toString()}`;
    const results = yield utils_1.prisma.search.findUnique({
        where: { request: url }
    });
    if (results) {
        return res.write({ error: false, results });
    }
    const response = yield utils_1.axios.get(url);
    const json = response.data;
    if ((_a = json.error) === null || _a === void 0 ? void 0 : _a.message) {
        return res.write({ error: true, message: json.error.message });
    }
    else if (!((_b = json.results) === null || _b === void 0 ? void 0 : _b.length)) {
        return res.write({
            error: false,
            results: {
                request: url,
                response: {
                    results: [],
                    next: ''
                }
            }
        });
    }
    const searchResults = [];
    for (const row of json.results) {
        searchResults.push({
            id: row.id,
            url: row.media_formats.gif.url,
            duration: row.media_formats.gif.duration,
            preview: row.media_formats.gif.preview,
            dims: row.media_formats.gif.dims || [],
            size: row.media_formats.gif.size,
            description: row.content_description,
            tags: row.tags || [],
            audio: row.hasaudio
        });
    }
    const searchResponse = {
        results: searchResults,
        next: json.next || ''
    };
    const data = { request: url, response: searchResponse };
    if (req.params.wait) {
        yield utils_1.prisma.search.create({ data });
        yield (0, utils_1.remit)('meme-cache', { url, results: searchResults });
    }
    else {
        utils_1.prisma.search.create({ data }).then((_) => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, utils_1.remit)('meme-cache', { url, results: searchResults });
        }));
    }
    res.write({ error: false, results: data });
}));
utils_1.emitter.on('meme-vote', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, url, cid } = req.params;
    const where = {};
    if (id) {
        where.id = id;
    }
    else if (url) {
        where.url = url;
    }
    else if (cid) {
        where.cid = cid;
    }
    const meme = yield utils_1.prisma.meme.findUniqueOrThrow({ where });
    const data = {};
    if (req.params.direction === utils_1.Direction.Down) {
        data.down = meme.down + 1;
    }
    else {
        data.up = meme.up + 1;
    }
    const results = yield utils_1.prisma.meme.update({ where, data });
    res.write({ error: false, results });
}));
exports.default = utils_1.emitter;
