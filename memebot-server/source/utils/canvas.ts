//--------------------------------------------------------------------//
// Use this if the server can install binaries (Larger Faster Version)
// @tensorflow/tfjs-core => 3.20.0
// @tensorflow/tfjs-node => 3.20.0
//--------------------------------------------------------------------//
import '@tensorflow/tfjs-node';
import * as faceapi from '@vladmandic/face-api';
const loadTF = async () => {};

//--------------------------------------------------------------------//
// Use this if the server cannot install binaries (Smaller Slower Version)
// @tensorflow/tfjs => 3.20.0
// @tensorflow/tfjs-backend-wasm => 3.20.0
//--------------------------------------------------------------------//
//import * as tf from '@tensorflow/tfjs';
//import * as faceapi from '@vladmandic/face-api/dist/face-api.node-wasm';
//const loadTF = async () => { await tf.ready(); };

//canvas node polyfills
import { createCanvas, loadImage } from 'canvas';

//centralized type defs
import {
  Canvas, 
  CanvasImage,
  CanvasContext,
  Image, 
  ImageData,
} from './types';

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
  faceapi, 
  createCanvas, 
  loadImage,
  loadTF
};