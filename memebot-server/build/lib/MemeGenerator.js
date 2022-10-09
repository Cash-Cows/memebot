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
const stream_1 = require("stream");
const form_data_1 = __importDefault(require("form-data"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const gif_encoder_2_1 = __importDefault(require("gif-encoder-2"));
const types_1 = require("../utils/types");
const canvas_1 = require("../utils/canvas");
const prisma_1 = require("../utils/prisma");
const Exception_1 = __importDefault(require("./Exception"));
const GifFaces_1 = __importDefault(require("./GifFaces"));
const ServiceContract_1 = require("./ServiceContract");
const Consumer_1 = __importDefault(require("./Consumer"));
const Source_1 = __importDefault(require("./Source"));
const { TENOR_KEY, INFURA_API_KEY, INFURA_API_SECRET } = process.env;
class MemeGenerator {
    static detect(source) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const gifFaces = new GifFaces_1.default();
            const url = typeof source === 'string' ? source : source.url;
            if (typeof source === 'string') {
                const sourceFromURL = yield Source_1.default.get(url);
                if (sourceFromURL) {
                    source = sourceFromURL;
                }
                else {
                    yield gifFaces.setBufferFromURL(url);
                    source = yield Source_1.default.makeFromCID(url, gifFaces.cid);
                }
            }
            if (source.data) {
                return yield Source_1.default.addCID(source);
            }
            if (!((_a = gifFaces.cid) === null || _a === void 0 ? void 0 : _a.length)) {
                yield gifFaces.setBufferFromURL(url);
            }
            const faces = yield gifFaces.detect();
            return yield Source_1.default.detect(url, faces, gifFaces.cid);
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
            return yield prisma_1.prisma.meme.findUnique({ where });
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
            return yield prisma_1.prisma.meme.findUniqueOrThrow({ where });
        });
    }
    static generate(consumer, source, service) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof consumer === 'string') {
                consumer = yield Consumer_1.default.getOrThrow(consumer);
            }
            if (typeof source === 'string') {
                source = yield Source_1.default.getOrThrow(source);
            }
            const exists = yield prisma_1.prisma.meme.findFirst({ where: {
                    consumerId: consumer.id,
                    sourceId: source.id
                } });
            if (exists) {
                return exists;
            }
            if (!Array.isArray(consumer.images) || !consumer.images.length) {
                throw Exception_1.default.for('Consumer has no images');
            }
            const totalBalance = yield service.balanceOf(consumer.walletAddress);
            if (!(yield this._canConsume(consumer, totalBalance, service.rate))) {
                throw Exception_1.default.for('Not enough balance');
            }
            const cid = yield this._upload(yield this._generate(consumer, source));
            yield Consumer_1.default.consume(consumer.walletAddress, ServiceContract_1.BigNumber
                .from(consumer.consumed)
                .add(service.rate)
                .toString());
            return yield prisma_1.prisma.meme.create({
                data: {
                    description: source.description,
                    url: `${service.config.ipfs}/ipfs/${cid}`,
                    cid: cid,
                    tags: source.tags || [],
                    sourceId: source.id,
                    consumerId: consumer.id
                }
            });
        });
    }
    static generateOne(consumer, query, service, skip = 0, range = 1) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof consumer === 'string') {
                consumer = yield Consumer_1.default.getOrThrow(consumer);
            }
            const sources = yield Source_1.default.findManyWithData(query, skip, range);
            if (!sources.length) {
                return null;
            }
            for (const source of sources) {
                if (!Array.isArray(source.data) || !source.data.length) {
                    continue;
                }
                try {
                    return yield this.generate(consumer, source, service);
                }
                catch (e) {
                }
            }
            return yield this.generateOne(consumer, query, service, skip + range, range);
        });
    }
    static search(query, wait = false) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const search = new URLSearchParams(Object.assign(Object.assign({ limit: '50' }, query), {
                client_key: 'tenorcept',
                key: TENOR_KEY
            }));
            const url = `https://tenor.googleapis.com/v2/search?${search.toString()}`;
            const results = yield prisma_1.prisma.search.findUnique({
                where: { request: url }
            });
            if (results) {
                return results;
            }
            const tenorResponse = yield this._fetchJSON(url);
            if ((_a = tenorResponse.error) === null || _a === void 0 ? void 0 : _a.message) {
                throw Exception_1.default.for(tenorResponse.error.message);
            }
            else if (!((_b = tenorResponse.results) === null || _b === void 0 ? void 0 : _b.length)) {
                return {
                    request: url,
                    response: {
                        results: [],
                        next: ''
                    }
                };
            }
            const searchResults = [];
            for (const row of tenorResponse.results) {
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
                next: tenorResponse.next || ''
            };
            const data = { request: url, response: searchResponse };
            if (wait) {
                yield prisma_1.prisma.search.create({ data });
                yield Source_1.default.cache(url, searchResults);
            }
            else {
                prisma_1.prisma.search.create({ data }).then((_) => __awaiter(this, void 0, void 0, function* () {
                    yield Source_1.default.cache(url, searchResults);
                }));
            }
            return data;
        });
    }
    static vote(meme, direction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof meme === 'string' || typeof meme === 'number') {
                meme = yield this.getOrThrow(meme);
            }
            const data = {};
            if (direction == types_1.Direction.Up) {
                data.up = meme.up + 1;
            }
            else if (direction == types_1.Direction.Down) {
                data.down = meme.down + 1;
            }
            yield Source_1.default.vote(meme.sourceId, direction);
            return yield prisma_1.prisma.meme.update({ where: { id: meme.id }, data });
        });
    }
    static _canConsume(consumer, totalBalance, rate) {
        return __awaiter(this, void 0, void 0, function* () {
            return parseInt(totalBalance
                .sub(ServiceContract_1.BigNumber.from(consumer.consumed))
                .sub(rate)
                .toString()) > 0;
        });
    }
    static _chooseImage(images, index) {
        return images[index % images.length];
    }
    static _drawFace(canvasImage, image, face) {
        const { width: iWidth, height: iHeight } = image;
        const { x, y, width, height } = face;
        canvasImage.context.drawImage(image, 0, 0, iWidth, iHeight, x, y, width, height);
    }
    static _drawFrame(canvasImage, frame) {
        const { top, left } = frame.dims;
        canvasImage.image.data.set(frame.patch);
        canvasImage.context.putImageData(canvasImage.image, top, left);
    }
    static _fetchJSON(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield (0, node_fetch_1.default)(url);
            return response.json();
        });
    }
    static _generate(consumer, source) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Array.isArray(source.data) || !source.data.length) {
                throw Exception_1.default.for('No faces were detected');
            }
            const face = yield this._makeImage(this._chooseImage(consumer.images, Math.floor(Math.random() * 1000)));
            const buffer = yield GifFaces_1.default.getBuffer(source.url);
            const frames = GifFaces_1.default.getGifFrames(buffer);
            if (frames.length !== source.data.length) {
                throw Exception_1.default.for('Frames do not match source');
            }
            const { width, height } = frames[0].dims;
            const canvasImage = GifFaces_1.default.makeCanvasImage(width, height);
            const animation = new gif_encoder_2_1.default(width, height);
            animation.start();
            for (let i = 0; i < frames.length; i++) {
                const frame = frames[i];
                this._drawFrame(canvasImage, frame);
                const faces = source.data[i];
                for (let j = 0; j < faces.length; j++) {
                    this._drawFace(canvasImage, face, faces[j]);
                }
                animation.setDelay(frame.delay || 0);
                animation.addFrame(canvasImage.context);
            }
            animation.finish();
            return animation;
        });
    }
    static _makeImage(src) {
        return new Promise((resolve, reject) => {
            const image = new canvas_1.Image();
            image.onload = () => resolve(image);
            image.onerror = e => reject(e);
            image.src = src;
        });
    }
    static _upload(animation) {
        return new Promise((resolve, reject) => {
            const form = new form_data_1.default();
            form.append('file', stream_1.Readable.from(animation.out.getData()));
            (0, node_fetch_1.default)(`https://ipfs.infura.io:5001/api/v0/add`, {
                method: 'POST',
                headers: Object.assign(Object.assign({}, form.getHeaders()), { authorization: `Basic ${Buffer
                        .from(`${INFURA_API_KEY}:${INFURA_API_SECRET}`)
                        .toString('base64')}` }),
                body: form
            })
                .then(response => response.json().then(json => resolve(json.Hash)))
                .catch(error => reject(error));
        });
    }
}
exports.default = MemeGenerator;
