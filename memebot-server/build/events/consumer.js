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
utils_1.emitter.on('consumer-detail', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, discordId, walletAddress } = req.params;
    const where = {};
    if (id) {
        where.id = id;
    }
    else if (walletAddress) {
        where.walletAddress = walletAddress;
    }
    else if (discordId) {
        where.discordId = discordId;
    }
    const consumer = yield utils_1.prisma.consumer.findUniqueOrThrow({ where });
    const balance = yield utils_1.service.balanceOf(consumer.walletAddress);
    const consumed = utils_1.BigNumber.from(consumer.consumed);
    res.write({
        error: false,
        results: Object.assign(Object.assign({}, consumer), { loadedBalance: balance.toString(), availableBalance: balance.sub(consumed).toString(), serviceRate: utils_1.service.rate.toString() })
    });
}));
utils_1.emitter.on('consumer-upsert', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, discordId, walletAddress } = req.params;
    const where = {};
    if (id) {
        where.id = id;
    }
    else if (walletAddress) {
        where.walletAddress = walletAddress;
    }
    else if (discordId) {
        where.discordId = discordId;
    }
    const create = {
        walletAddress: req.params.walletAddress,
        discordId: req.params.discordId,
        images: req.params.images || []
    };
    const update = {};
    for (const key of ['walletAddress', 'discordId', 'images', 'consumed']) {
        if (req.params[key]) {
            update[key] = req.params[key];
        }
    }
    const results = yield utils_1.prisma.consumer.upsert({ where, update, create });
    res.write({ error: false, results });
}));
