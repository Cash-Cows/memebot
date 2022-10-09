/// <reference types="node" />
import type { Box, Frame } from '../utils/types';
import { Canvas, CanvasImage } from '../utils/canvas';
export declare class GifFacesUtils {
    private static modelsLoaded;
    static bufferIsGif(buffer: Buffer): boolean;
    static copyCanvas(source: Canvas, destination: Canvas): Canvas;
    static cloneCanvas(source: Canvas): Canvas;
    static detectGifFaces(frames: Frame[], padding?: number): Promise<Box[][]>;
    static getBuffer(url: string): Promise<Buffer>;
    static getCID(buffer: Buffer | string): Promise<string>;
    static getGifFrames(buffer: Buffer): import("gifuct-js").ParsedFrame[];
    static loadModels(path: string): Promise<boolean>;
    static makeCanvasImage(width: number, height: number): CanvasImage;
    static modelsAreLoaded(path: string): boolean;
    private static _detectFaces;
    private static _drawPatch;
    private static _getImage;
    private static _makeOuterBox;
}
export default class GifFaces extends GifFacesUtils {
    private _buffer;
    private _cid;
    get buffer(): Buffer;
    get cid(): string;
    detect(padding?: number): Promise<Box[][]>;
    setBuffer(buffer: Buffer): Promise<this>;
    setBufferFromURL(url: string): Promise<this>;
    private _setBuffer;
}
