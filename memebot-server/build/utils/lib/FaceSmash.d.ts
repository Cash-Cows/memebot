/// <reference types="node" />
import GIFEncoder from 'gif-encoder-2';
import type { Box, Frame } from '../types';
import { Canvas, CanvasImage } from '../canvas';
export declare class FaceSmashUtils {
    private static modelsLoaded;
    static bufferIsGif(buffer: Buffer): boolean;
    static copyCanvas(source: Canvas, destination: Canvas): Canvas;
    static cloneCanvas(source: Canvas): Canvas;
    static detectFaces(frames: Frame[], padding?: number): Promise<Box[][]>;
    static getBuffer(url: string): Promise<Buffer>;
    static getCID(buffer: Buffer | string): Promise<string>;
    static getGifFrames(buffer: Buffer): import("gifuct-js").ParsedFrame[];
    static loadModels(path: string): Promise<boolean>;
    static makeCanvasImage(width: number, height: number): CanvasImage;
    static modelsAreLoaded(path: string): boolean;
    static pasteFaces(gif: string | Buffer, faceURL: string, detections: Box[][]): Promise<GIFEncoder>;
    private static _detectFaces;
    private static _drawFace;
    private static _drawFrame;
    private static _drawPatch;
    private static _getImage;
    private static _makeOuterBox;
}
export default class FaceSmash extends FaceSmashUtils {
    private _buffer;
    private _cid;
    get buffer(): Buffer;
    get cid(): string;
    detect(padding?: number): Promise<Box[][]>;
    pasteFaces(faceURL: string, detections: Box[][]): Promise<GIFEncoder>;
    setBuffer(buffer: Buffer): Promise<this>;
    setBufferFromURL(url: string): Promise<this>;
    private _setBuffer;
}
