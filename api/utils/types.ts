import { 
  Canvas, 
  Image, 
  ImageData,
  CanvasRenderingContext2D
} from 'canvas';

export { 
  Canvas, 
  Image, 
  ImageData
};

export type CanvasContext = CanvasRenderingContext2D;

export type Frame = {
  dims: { width: number, height: number, top: number, left: number },
  patch: ArrayLike<number>
};

export type Box = { x: number, y: number, width: number, height: number };

export type CanvasImage = { 
  canvas: Canvas, 
  context: CanvasContext, 
  image: ImageData 
};

export type ObjectString = Record<string, string>;
export type ObjectAny = Record<string, any>;

export type MediaFormat = {
  url: string,
  duration: number,
  preview: string,
  dims: number[],
  size: number
};

export type TenorResult = {
  id: string,
  title: string,
  media_formats: Record<string, MediaFormat>,
  created: number,
  content_description: string,
  itemurl: string,
  url: string,
  tags: string[],
  hasaudio: boolean
};

export type TenorResponse = {
  error?: {  message: string },
  results?: TenorResult[],
  next?: string
};

export type SearchResult = {
  id: string,
  url: string,
  duration: number,
  preview: string,
  dims: number[],
  size: number,
  description: string,
  tags: string[],
  audio: boolean
};

export type SearchResponse = {
  results: SearchResult[],
  next: string
};

export type TX = { tx: string };

export enum Direction { Up, Down };