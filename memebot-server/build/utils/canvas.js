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
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadTF = exports.loadImage = exports.createCanvas = exports.faceapi = exports.ImageData = exports.Image = exports.Canvas = void 0;
require("@tensorflow/tfjs-node");
const faceapi = __importStar(require("@vladmandic/face-api"));
exports.faceapi = faceapi;
const loadTF = () => __awaiter(void 0, void 0, void 0, function* () { });
exports.loadTF = loadTF;
const canvas_1 = require("canvas");
Object.defineProperty(exports, "createCanvas", { enumerable: true, get: function () { return canvas_1.createCanvas; } });
Object.defineProperty(exports, "loadImage", { enumerable: true, get: function () { return canvas_1.loadImage; } });
const types_1 = require("./types");
Object.defineProperty(exports, "Canvas", { enumerable: true, get: function () { return types_1.Canvas; } });
Object.defineProperty(exports, "Image", { enumerable: true, get: function () { return types_1.Image; } });
Object.defineProperty(exports, "ImageData", { enumerable: true, get: function () { return types_1.ImageData; } });
faceapi.env.monkeyPatch({ Canvas: types_1.Canvas, Image: types_1.Image, ImageData: types_1.ImageData });
