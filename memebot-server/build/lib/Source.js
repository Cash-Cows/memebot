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
const ipfs_only_hash_1 = __importDefault(require("ipfs-only-hash"));
const types_1 = require("../utils/types");
const prisma_1 = require("../utils/prisma");
class Source {
    static addCID(source, cid = null) {
        return __awaiter(this, void 0, void 0, function* () {
            if (source.cid) {
                return source;
            }
            if (!cid) {
                const response = yield fetch(source.url);
                const buffer = Buffer.from(yield response.arrayBuffer());
                cid = yield ipfs_only_hash_1.default.of(buffer);
            }
            return yield prisma_1.prisma.source.update({
                where: { id: source.id },
                data: { cid: cid }
            });
        });
    }
    static cache(url, results) {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = [];
            for (const row of results) {
                rows.push({
                    description: row.description,
                    url: row.url,
                    source: url,
                    tags: row.tags
                });
            }
            const dupes = (yield prisma_1.prisma.source.findMany({
                where: {
                    OR: rows.map(row => row.url).map(url => ({ url }))
                }
            })).map(row => row.url);
            const filtered = rows.filter(row => dupes.indexOf(row.url) === -1);
            if (filtered.length) {
                yield prisma_1.prisma.source.createMany({ data: filtered });
            }
        });
    }
    static detect(url, faces, cid = null) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = { data: faces };
            if (cid) {
                data.cid = cid;
            }
            return yield prisma_1.prisma.source.update({ where: { url }, data });
        });
    }
    static get(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const where = {};
            if (typeof id === 'string') {
                where.url = id;
            }
            else {
                where.id = id;
            }
            return yield prisma_1.prisma.source.findUnique({ where });
        });
    }
    static getOrThrow(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const where = {};
            if (typeof id === 'string') {
                where.url = id;
            }
            else {
                where.id = id;
            }
            return yield prisma_1.prisma.source.findUniqueOrThrow({ where });
        });
    }
    static makeFromCID(url, cid) {
        return __awaiter(this, void 0, void 0, function* () {
            const source = yield prisma_1.prisma.source.findUnique({
                where: { cid: cid }
            });
            if (source) {
                return source;
            }
            return yield prisma_1.prisma.source.upsert({
                where: { url },
                update: { cid },
                create: {
                    url,
                    cid,
                    description: '',
                    source: '',
                    tags: []
                }
            });
        });
    }
    static findManyWithData(query, skip = 0, take = 25) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.prisma.source.findMany({
                where: {
                    data: { not: prisma_1.Prisma.JsonNull },
                    OR: [
                        { description: { contains: query } },
                        { tags: { array_contains: [query] } }
                    ]
                },
                skip,
                take
            });
        });
    }
    static findManyWithNoData(skip = 0, take = 100) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.prisma.source.findMany({
                where: { cid: null },
                skip,
                take
            });
        });
    }
    static findManyWithSource(source) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.prisma.source.findMany({ where: { source } });
        });
    }
    static vote(source, direction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof source === 'string' || typeof source === 'number') {
                source = yield this.getOrThrow(source);
            }
            const data = {};
            if (direction == types_1.Direction.Up) {
                data.up = source.up + 1;
            }
            else if (direction == types_1.Direction.Down) {
                data.down = source.down + 1;
            }
            return yield prisma_1.prisma.source.update({ where: { id: source.id }, data });
        });
    }
}
exports.default = Source;
