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
exports.FaceSmashUtils = void 0;
const ipfs_only_hash_1 = __importDefault(require("ipfs-only-hash"));
const axios_1 = __importDefault(require("axios"));
const gif_encoder_2_1 = __importDefault(require("gif-encoder-2"));
const gifuct_js_1 = require("gifuct-js");
const canvas_1 = require("../canvas");
const framework_1 = require("@inceptjs/framework");
class FaceSmashUtils {
    static bufferIsGif(buffer) {
        return buffer.toString('hex', 0, 4) !== '47494638';
    }
    static copyCanvas(source, destination) {
        destination.getContext('2d').drawImage(source, 0, 0);
        return destination;
    }
    static cloneCanvas(source) {
        const canvas = (0, canvas_1.createCanvas)(source.width, source.height);
        canvas.width = source.width;
        canvas.height = source.height;
        canvas.getContext('2d').drawImage(source, 0, 0);
        return canvas;
    }
    static detectFaces(frames, padding = 0.4) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            if (!frames.length) {
                return resolve([]);
            }
            const { width, height } = frames[0].dims;
            const master = this.makeCanvasImage(width, height);
            let firstFaces = [];
            let lastFaces = [];
            const data = [];
            for (const frame of frames) {
                const faces = yield this._detectFaces(master, frame, padding);
                if (faces.length) {
                    lastFaces = faces;
                }
                if (!firstFaces) {
                    firstFaces = lastFaces;
                }
                data.push(lastFaces);
            }
            if (!lastFaces.length) {
                return resolve([]);
            }
            data.forEach(faces => faces ? faces : firstFaces);
            return resolve(data);
        }));
    }
    static getBuffer(url) {
        return new Promise((resolve, reject) => {
            axios_1.default.get(url, { responseType: 'arraybuffer' })
                .then(response => Buffer.from(response.data))
                .then(buffer => {
                if (this.bufferIsGif(buffer)) {
                    reject(framework_1.Exception.for('URL is not a gif'));
                }
                else {
                    resolve(buffer);
                }
            });
        });
    }
    static getCID(buffer) {
        return ipfs_only_hash_1.default.of(buffer);
    }
    static getGifFrames(buffer) {
        return (0, gifuct_js_1.decompressFrames)((0, gifuct_js_1.parseGIF)(buffer), true);
    }
    static loadModels(path) {
        if (this.modelsAreLoaded(path)) {
            return new Promise(resolve => resolve(true));
        }
        return Promise.all([
            canvas_1.faceapi.nets.faceRecognitionNet.loadFromDisk(path),
            canvas_1.faceapi.nets.faceLandmark68Net.loadFromDisk(path),
            canvas_1.faceapi.nets.ssdMobilenetv1.loadFromDisk(path)
        ]).then(_ => (this.modelsLoaded[path] = true));
    }
    static makeCanvasImage(width, height) {
        const canvas = (0, canvas_1.createCanvas)(width, height);
        const context = canvas.getContext('2d');
        const image = context.createImageData(width, height);
        return { canvas, context, image };
    }
    static modelsAreLoaded(path) {
        return this.modelsLoaded[path] || false;
    }
    static pasteFaces(gif, faceURL, detections) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const buffer = typeof gif === 'string'
                ? yield FaceSmash.getBuffer(gif)
                : gif;
            const frames = FaceSmash.getGifFrames(buffer);
            const face = yield this._getImage(faceURL, false);
            if (frames.length !== detections.length) {
                return reject('GIF does not match detections');
            }
            const { width, height } = frames[0].dims;
            const canvasImage = FaceSmash.makeCanvasImage(width, height);
            const animation = new gif_encoder_2_1.default(width, height);
            animation.start();
            for (let i = 0; i < frames.length; i++) {
                const frame = frames[i];
                this._drawFrame(canvasImage, frame);
                const faces = detections[i];
                for (let j = 0; j < faces.length; j++) {
                    this._drawFace(canvasImage, face, faces[j]);
                }
                animation.setDelay(frame.delay || 0);
                animation.addFrame(canvasImage.context);
            }
            animation.finish();
            resolve(animation);
        }));
    }
    static _detectFaces(canvasImage, frame, padding = 0.4) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            this._drawPatch(canvasImage, frame);
            const image = yield this._getImage(canvasImage.canvas.toDataURL());
            const detections = yield canvas_1.faceapi
                .detectAllFaces(image)
                .withFaceLandmarks()
                .withFaceDescriptors();
            if (!detections.length) {
                return resolve([]);
            }
            return resolve(canvas_1.faceapi.resizeResults(detections, {
                width: image.width,
                height: image.height
            }).map(face => this._makeOuterBox(face.detection.box, padding)));
        }));
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
    static _drawPatch(previous, frame) {
        const { top, left } = frame.dims;
        previous.image.data.set(frame.patch);
        previous.context.putImageData(previous.image, top, left);
    }
    static _getImage(src, html = true) {
        return new Promise((resolve, reject) => {
            const image = html ? canvas_1.faceapi.env.getEnv().createImageElement() : new canvas_1.Image();
            image.onload = () => resolve(image);
            image.onerror = (error) => reject(error);
            image.src = src;
        });
    }
    static _makeOuterBox(box, percent) {
        const padding = {
            x: box.width * percent,
            y: box.height * percent
        };
        return {
            x: box.x - padding.x,
            y: box.y - (padding.y * 1.5),
            width: box.width + (padding.x * 2),
            height: box.height + (padding.y * 2)
        };
    }
}
exports.FaceSmashUtils = FaceSmashUtils;
FaceSmashUtils.modelsLoaded = {};
class FaceSmash extends FaceSmashUtils {
    get buffer() {
        return this._buffer;
    }
    get cid() {
        return this._cid;
    }
    detect(padding = 0.4) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._buffer) {
                throw framework_1.Exception.for('Buffer not set. use setBuffer() first');
            }
            const frames = FaceSmash.getGifFrames(this._buffer);
            if (!frames.length) {
                throw framework_1.Exception.for('No frames found');
            }
            return yield FaceSmash.detectFaces(frames, padding);
        });
    }
    pasteFaces(faceURL, detections) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield FaceSmashUtils.pasteFaces(this.buffer, faceURL, detections);
        });
    }
    setBuffer(buffer) {
        return __awaiter(this, void 0, void 0, function* () {
            if (buffer.toString('hex', 0, 4) !== '47494638') {
                throw framework_1.Exception.for('URL is not a gif');
            }
            return this._setBuffer(buffer);
        });
    }
    setBufferFromURL(url) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._setBuffer(yield FaceSmash.getBuffer(url));
        });
    }
    _setBuffer(buffer) {
        return __awaiter(this, void 0, void 0, function* () {
            this._buffer = buffer;
            this._cid = yield ipfs_only_hash_1.default.of(this._buffer);
            return this;
        });
    }
}
exports.default = FaceSmash;
