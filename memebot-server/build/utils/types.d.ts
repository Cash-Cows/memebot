import { Canvas, Image, ImageData, CanvasRenderingContext2D } from 'canvas';
export { Canvas, Image, ImageData };
export declare type CanvasContext = CanvasRenderingContext2D;
export declare type Frame = {
    dims: {
        width: number;
        height: number;
        top: number;
        left: number;
    };
    patch: ArrayLike<number>;
};
export declare type Box = {
    x: number;
    y: number;
    width: number;
    height: number;
};
export declare type CanvasImage = {
    canvas: Canvas;
    context: CanvasContext;
    image: ImageData;
};
export declare type ObjectString = Record<string, string>;
export declare type ObjectAny = Record<string, any>;
export declare type MediaFormat = {
    url: string;
    duration: number;
    preview: string;
    dims: number[];
    size: number;
};
export declare type TenorResult = {
    id: string;
    title: string;
    media_formats: Record<string, MediaFormat>;
    created: number;
    content_description: string;
    itemurl: string;
    url: string;
    tags: string[];
    hasaudio: boolean;
};
export declare type TenorResponse = {
    error?: {
        message: string;
    };
    results?: TenorResult[];
    next?: string;
};
export declare type SearchResult = {
    id: string;
    url: string;
    duration: number;
    preview: string;
    dims: number[];
    size: number;
    description: string;
    tags: string[];
    audio: boolean;
};
export declare type SearchResponse = {
    results: SearchResult[];
    next: string;
};
export declare type TX = {
    tx: string;
};
export declare enum Direction {
    Up = 0,
    Down = 1
}
export declare type IPFSResponse = {
    Name: string;
    Hash: string;
    Size: string;
};
