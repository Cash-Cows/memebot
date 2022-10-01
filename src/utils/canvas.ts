// import nodejs bindings to native tensorflow,
// not required, but will speed up things drastically (python required)
import '@tensorflow/tfjs-node';

import * as faceapi from '@vladmandic/face-api';

import {
  Canvas, 
  CanvasImage,
  CanvasContext,
  Image, 
  ImageData,
} from './types';

import { 
  createCanvas, 
  loadImage 
} from 'canvas';

// patch nodejs environment, we need to provide an implementation of
// HTMLCanvasElement and HTMLImageElement
//@ts-ignore
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

export { 
  Canvas, 
  CanvasImage,
  CanvasContext, 
  Image, 
  ImageData, 
  createCanvas, 
  loadImage 
};