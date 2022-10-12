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
utils_1.emitter.on('source-detail', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, url, cid, upsert } = req.params;
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
    const results = yield utils_1.prisma.source.findUniqueOrThrow({ where });
    if (!results && upsert) {
        return yield (0, utils_1.remit)('source-upsert', req, res);
    }
    res.write({ error: false, results });
}));
utils_1.emitter.on('source-search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { q, detected, start, range } = req.params;
    const where = {};
    if (detected) {
        where.data = { not: utils_1.Prisma.JsonNull };
    }
    if (q) {
        where.OR = [
            { description: { contains: q } },
            { tags: { array_contains: [q] } }
        ];
    }
    const results = yield utils_1.prisma.source.findMany({
        where,
        skip: start,
        take: range
    });
    res.write({ error: false, results });
}));
utils_1.emitter.on('source-upsert', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    const create = {
        url,
        cid: cid || null,
        description: req.params.description || '',
        source: req.params.source || '',
        tags: req.params.tags || [],
        data: req.params.data || null
    };
    const update = {};
    for (const key of ['cid', 'description', 'source', 'tags', 'data']) {
        if (req.params[key]) {
            update[key] = req.params[key];
        }
    }
    const results = yield utils_1.prisma.source.upsert({ where, update, create });
    res.write({ error: false, results });
}));
utils_1.emitter.on('source-detect-faces', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let source = req.params.source;
    const faceSmash = new utils_1.FaceSmash();
    const url = typeof source === 'string' ? source : source.url;
    if (typeof source === 'string') {
        const sourceFromURL = yield (0, utils_1.remit)('source-detail', { url });
        if (sourceFromURL) {
            source = sourceFromURL;
        }
        else {
            yield faceSmash.setBufferFromURL(url);
            source = (yield (0, utils_1.remit)('source-detail', {
                cid: faceSmash.cid,
                upsert: true
            }));
        }
    }
    if (typeof source !== 'string' && source.data) {
        if (!source.cid) {
            yield faceSmash.setBufferFromURL(url);
            yield (0, utils_1.remit)('source-upsert', { url, cid: faceSmash.cid });
            source.cid = faceSmash.cid;
        }
        return res.write({ error: false, results: source });
    }
    if (!((_a = faceSmash.cid) === null || _a === void 0 ? void 0 : _a.length)) {
        yield faceSmash.setBufferFromURL(url);
    }
    const faces = yield faceSmash.detect();
    const results = yield (0, utils_1.remit)('source-upsert', {
        url,
        cid: faceSmash.cid,
        data: faces
    });
    res.write({ error: false, results });
}));
