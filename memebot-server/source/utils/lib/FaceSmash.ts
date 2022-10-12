//used to get content identfiers of file buffers (sent to db)
import CID from 'ipfs-only-hash';
//used to fetch remote gifs
import axios from 'axios';
//used to make animated gifs
import GIFEncoder from 'gif-encoder-2';
//split animated gifs into franes
import { parseGIF, decompressFrames } from 'gifuct-js';
//centralized type defs
import type { Box, Frame } from '../types';
//canvas node polyfills
import { 
  Canvas, 
  Image, 
  CanvasImage, 
  createCanvas, 
  faceapi 
} from '../canvas';
//expressive error reporting pattern
import { Exception } from '@inceptjs/framework';

export class FaceSmashUtils {
  /* Private Static Properties
  --------------------------------------------------------------------*/

  //a record of which path models are loaded
  private static modelsLoaded: Record<string, boolean> = {};

  /* Public Static Methods
  --------------------------------------------------------------------*/

  /**
   * Returns true if the given buffer is a gif
   */
  public static bufferIsGif(buffer: Buffer): boolean {
    return buffer.toString('hex', 0, 4) !== '47494638';
  }

  /**
   * Copies the contents of a canvas into another canvas
   */
  public static copyCanvas(source: Canvas, destination: Canvas): Canvas {
    // draw source over the destination canvas
    destination.getContext('2d').drawImage(source, 0, 0);
    return destination;
  }
  
  /**
   * Returns a cloned version of the given canvas
   */
  public static cloneCanvas(source: Canvas): Canvas {
    const canvas = createCanvas(source.width, source.height);
    //get the dims
    canvas.width = source.width
    canvas.height = source.height
    // draw source over the destination canvas
    canvas.getContext('2d').drawImage(source, 0, 0)
    return canvas
  }

  /**
   * Returns all the face coordanates found in the given frames
   */
  public static detectFaces(
    frames: Frame[], 
    padding: number = 0.4
  ): Promise<Box[][]> {
    return new Promise(async resolve => {
      //if no frames
      if (!frames.length) {
        return resolve([]);
      }

      //make a master frame
      const { width, height } = frames[0].dims;
      const master = this.makeCanvasImage(width, height);
      let firstFaces: Box[] = [];
      let lastFaces: Box[] = [];
      const data: Box[][] = [];

      for (const frame of frames) {
        //get face boxes
        const faces = await this._detectFaces(master, frame, padding);
        //if no face boxes
        if (faces.length) {
          //use the last face boxes
          lastFaces = faces;
        }
    
        //if this is the first set of faces, set it
        if (!firstFaces) {
          firstFaces = lastFaces;
        }
        
        data.push(lastFaces);
      }
    
      //if no faces found
      if (!lastFaces.length) {
        return resolve([]);
      }
    
      //fill all the false faces with the first faces
      data.forEach(faces => faces ? faces : firstFaces);
    
      return resolve(data);
    });
  }

  /**
   * Returns the buffered content of a url source
   */
  public static getBuffer(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      axios.get(url, { responseType: 'arraybuffer' })
        .then(response => Buffer.from(response.data))
        .then(buffer => {
          //if the buffer is not a gif
          if (this.bufferIsGif(buffer)) {
            reject(Exception.for('URL is not a gif'));
          } else {
            resolve(buffer);
          }
        })
    });
  }

  /**
   * Returns the CID of a buffer
   */
  public static getCID(buffer: Buffer|string): Promise<string> {
    return CID.of(buffer);
  }

  /**
   * Returns all the frame image data of a buffer (should be a gif)
   */
  public static getGifFrames(buffer: Buffer) {
    return decompressFrames(parseGIF(buffer), true);
  }

  /**
   * Loads all face detection models found in a given path
   */
  public static loadModels(path: string): Promise<boolean> {
    //if models are already loaded
    if (this.modelsAreLoaded(path)) {
      return new Promise(resolve => resolve(true));
    }
    return Promise.all([
      faceapi.nets.faceRecognitionNet.loadFromDisk(path),
      faceapi.nets.faceLandmark68Net.loadFromDisk(path),
      faceapi.nets.ssdMobilenetv1.loadFromDisk(path)
    ]).then(_ => (this.modelsLoaded[path] = true));
  }

  /**
   * Makes a new Canvas and returns the context and the image
   */
  public static makeCanvasImage(
    width: number, 
    height: number
  ): CanvasImage {
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    const image = context.createImageData(width, height);
  
    return { canvas, context, image }
  }

  /**
   * Returns true if all face detection models are loaded from the given path
   */
  public static modelsAreLoaded(path: string) {
    return this.modelsLoaded[path] || false;
  }

  /**
   * Generates the meme
   */
  public static pasteFaces(
    gif: string|Buffer, 
    faceURL: string, 
    detections: Box[][]
  ): Promise<GIFEncoder> {
    return new Promise(async (resolve, reject) => {
      const buffer = typeof gif === 'string'
        ? await FaceSmash.getBuffer(gif)
        : gif;
      const frames = FaceSmash.getGifFrames(buffer);
      const face = await this._getImage(faceURL, false) as Image;
      if (frames.length !== detections.length) {
        return reject('GIF does not match detections');
      }

      const { width, height } = frames[0].dims;
      const canvasImage = FaceSmash.makeCanvasImage(width, height);
      const animation = new GIFEncoder(width, height);
      animation.start();

      for(let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        this._drawFrame(canvasImage, frame);
        const faces = detections[i] as Box[];
        for (let j = 0; j < faces.length; j++) {
          //draw the face
          this._drawFace(canvasImage, face, faces[j]);
        }

        animation.setDelay(frame.delay || 0);
        animation.addFrame(canvasImage.context);
      }

      animation.finish();

      resolve(animation);
    })
  }

  /* Private Static Methods
  --------------------------------------------------------------------*/

  /**
   * Detects faces of the given CanvasImage
   */
  private static _detectFaces(
    canvasImage: CanvasImage, 
    frame: Frame, 
    padding: number = 0.4
  ): Promise<Box[]> {
    return new Promise(async resolve => {
      //draw frame on top of the master frame
      this._drawPatch(canvasImage, frame);
      //convert it to an image
      const image = await this._getImage(
        canvasImage.canvas.toDataURL()
      ) as HTMLImageElement;
    
      //detect all faces
      const detections = await faceapi
        .detectAllFaces(image)
        .withFaceLandmarks()
        .withFaceDescriptors();
      
      //if no faces
      if (!detections.length) {
        return resolve([]);
      }
    
      //resize the results based on the display size
      return resolve(faceapi.resizeResults(detections, { 
        width: image.width, 
        height: image.height 
      //then resize again, adding padding
      }).map(face => this._makeOuterBox(
        face.detection.box, 
        padding
      )));
    })
  }

  /**
   * Draws a face on the given canvas
   */
  private static _drawFace(
    canvasImage: CanvasImage, 
    image: Image, 
    face: Box
  ) {
    const { width: iWidth, height: iHeight } = image;
    const { x, y, width, height } = face;
    canvasImage.context.drawImage(
      image, 0, 0, iWidth, iHeight, x, y, width, height
    );
  }

  /**
   * Draws a frame on the given canvas
   */
  private static _drawFrame(canvasImage: CanvasImage, frame: Frame) {
    const { top, left } = frame.dims
    // set the patch data as an override
    canvasImage.image.data.set(frame.patch);
    // draw the patch back over the canvas
    canvasImage.context.putImageData(canvasImage.image, top, left);
  }

  /**
   * Draws the given frame into the given CanvasImage
   */
  private static _drawPatch(previous: CanvasImage, frame: Frame) {
    const { top, left } = frame.dims;
  
    // set the patch data as an override
    previous.image.data.set(frame.patch);
  
    // draw the patch back over the canvas
    previous.context.putImageData(previous.image, top, left);
  }
  
  /**
   * Returns an Image given the source
   */
  private static _getImage(
    src: string, 
    html = true
  ): Promise<HTMLImageElement|Image> {
    return new Promise((resolve, reject) => {
      const image = html? faceapi.env.getEnv().createImageElement(): new Image();
      image.onload = () => resolve(image)
      image.onerror = (error: Error) => reject(error)
      image.src = src;
    })
  }
  
  /**
   * Returns padded box coordinates
   */
  private static _makeOuterBox(box: Box, percent: number): Box {
    const padding = {
      x: box.width * percent,
      y: box.height * percent
    }
    return {
      x: box.x - padding.x,
      y: box.y - (padding.y * 1.5),
      width: box.width + (padding.x * 2),
      height: box.height + (padding.y * 2)
    }
  }
}

export default class FaceSmash extends FaceSmashUtils {
  /* Private Properties
  --------------------------------------------------------------------*/
  
  //The active buffer being worked on
  private _buffer: Buffer;
  //The CID of the current buffer
  private _cid: string;

  /* Getter Methods
  --------------------------------------------------------------------*/

  /**
   * Returns the active buffer being worked on
   */
  get buffer(): Buffer {
    return this._buffer;
  }

  /**
   * Returns the CID of the current buffer
   */
  get cid(): string {
    return this._cid;
  }

  /* Public Methods
  --------------------------------------------------------------------*/

  /**
   * Returns all the face coordanates found in the current gif buffer
   */
  public async detect(padding: number = 0.4) {
    if (!this._buffer) {
      throw Exception.for('Buffer not set. use setBuffer() first');
    }

    //get gif frames
    const frames = FaceSmash.getGifFrames(this._buffer);
    //if no frames
    if (!frames.length) {
      throw Exception.for('No frames found');
    }

    return await FaceSmash.detectFaces(frames, padding);
  }

  /**
   * Generates the meme
   */
  public async pasteFaces(faceURL: string, detections: Box[][]) {
    return await FaceSmashUtils.pasteFaces(this.buffer, faceURL, detections);
  }

  /**
   * Sets the current gif buffer (and sets the CID too)
   */
  public async setBuffer(buffer: Buffer) {
    //if the buffer is not a gif
    if (buffer.toString('hex', 0, 4) !== '47494638') {
      throw Exception.for('URL is not a gif');
    }

    return this._setBuffer(buffer);
  }

  /**
   * Sets the current gif buffer given the url
   */
  public async setBufferFromURL(url: string) {
    return await this._setBuffer(await FaceSmash.getBuffer(url));
  }

  /* Private Methods
  --------------------------------------------------------------------*/

  /**
   * Sets the current buffer (and sets the CID too)
   */
  private async _setBuffer(buffer: Buffer) {
    this._buffer = buffer;
    this._cid = await CID.of(this._buffer);
    return this;
  }
}