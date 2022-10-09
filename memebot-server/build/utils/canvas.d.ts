import '@tensorflow/tfjs-node';
import * as faceapi from '@vladmandic/face-api';
declare const loadTF: () => Promise<void>;
import { createCanvas, loadImage } from 'canvas';
import { Canvas, CanvasImage, CanvasContext, Image, ImageData } from './types';
export { Canvas, CanvasImage, CanvasContext, Image, ImageData, faceapi, createCanvas, loadImage, loadTF };
