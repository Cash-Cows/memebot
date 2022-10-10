//used to transform a buffer into a stream (for uploading)
import { Readable } from 'stream';
//used to format the request (for uploading to ipfs)
import FormData from 'form-data';
//used to fetch remote gifs
import fetch from 'node-fetch';
//used to make animated gifs
import GIFEncoder from 'gif-encoder-2';
//centralized type defs
import {
  Box,
  Frame,
  TenorResponse,
  SearchResult,
  SearchResponse,
  ObjectAny,
  CanvasImage,
  Direction
} from '../utils/types';
//canvas node polyfills
import { Image } from '../utils/canvas';
//meme table ORM (mysql)
import { prisma, Source, Consumer, Meme } from '../utils/prisma';
//expressive error reporting pattern
import Exception from './Exception';
//used to detect faces
import GifFaces from './GifFaces';
//used in generate to conume the tokens
import ServiceContract, { BigNumber } from './ServiceContract';
//used to get consumer info and balances
import ConsumerModel from './Consumer';
//used to get source info
import SourceModel from './Source';

const { TENOR_KEY, INFURA_API_KEY, INFURA_API_SECRET } = process.env;

export default class MemeGenerator {
  /* Public Static Methods
  --------------------------------------------------------------------*/

  /**
   * Detects faces in gif urls and caches it
   */
  public static async detect(source: string|Source) {
    //load gif face detect
    const gifFaces = new GifFaces();
    //determine the URL
    const url: string = typeof source === 'string' ? source: source.url;

    //make sure we have a source (wether found or created)
    //if source is the url
    if (typeof source === 'string') {
      //check if the source exists
      const sourceFromURL = await SourceModel.get(url);
      //if a source was found
      if (sourceFromURL) {
        source = sourceFromURL;
      } else {
        await gifFaces.setBufferFromURL(url);
        //make sure there is a CID
        source = await SourceModel.makeFromCID(url, gifFaces.cid);
      }
    }

    //if there is already data to this source
    if (source.data) {
      //send the entire source (CID included)
      return await SourceModel.addCID(source);
    }

    //if no cid (means there's no buffer)
    if (!gifFaces.cid?.length) {
      //load the buffer and cid
      await gifFaces.setBufferFromURL(url);
    }

    //detect faces
    const faces = await gifFaces.detect();

    //update the source
    return await SourceModel.detect(url, faces, gifFaces.cid);
  }

  /**
   * Returns meme info given the url
   */
  public static async get(id: number|string) {
    const where: ObjectAny = {};
    if (typeof id === 'string') {
      where.url = id;
    } else {
      where.id = id
    }
    return await prisma.meme.findUnique({ where });
  }

  /**
   * Returns meme info given the url
   */
  public static async getOrThrow(id: number|string) {
    const where: ObjectAny = {};
    if (typeof id === 'string') {
      where.url = id;
    } else {
      where.id = id
    }
    return await prisma.meme.findUniqueOrThrow({ where });
  }

  /**
   * Generates custom faces on top of gif memes
   */
  public static async generate(
    consumer: string|Consumer, 
    source: string|Source,
    service: ServiceContract
  ) {
    //get the consumer
    if (typeof consumer === 'string') {
      consumer = await ConsumerModel.getOrThrow(consumer);
    }
    //get the source
    if (typeof source === 'string') {
      source = await SourceModel.getOrThrow(source);
    }
    //check if sourceId already exists in meme
    const exists = await prisma.meme.findFirst({ where: { 
      consumerId: consumer.id, 
      sourceId: source.id 
    }});
    //if it does exists
    if (exists) {
      //then no need to do anything else
      return exists;
    }
    //make sure the consumer has images
    if (!Array.isArray(consumer.images) || !consumer.images.length) {
      throw Exception.for('Consumer has no images');
    } 
    
    //get the total balance from the blockchain
    const totalBalance = await service.balanceOf(consumer.walletAddress);
    if (!(await this._canConsume(consumer, totalBalance, service.rate))) {
      throw Exception.for('Not enough balance');
    }

    //start generating
    const cid = await this._upload(
      await this._generate(consumer, source)
    );

    //now consume it
    await ConsumerModel.consume(consumer.walletAddress, BigNumber
      .from(consumer.consumed)
      .add(service.rate)
      .toString() 
    );

    return await prisma.meme.create({ 
      data: {
        description: source.description,
        url: `${service.config.ipfs}/ipfs/${cid}`,
        cid: cid,
        tags: (source.tags as string[]) || [],
        sourceId: source.id,
        consumerId: consumer.id
      }
    });
  }

  /**
   * Generates one meme given search terms. Memes in this method are 
   * never returned twice..
   */
  public static async generateOne(
    consumer: string|Consumer, 
    query: string,
    service: ServiceContract,
    skip: number = 0,
    range: number = 1
  ): Promise<Meme|null> {
    //get the consumer
    if (typeof consumer === 'string') {
      consumer = await ConsumerModel.getOrThrow(consumer);
    }
  
    //find sources that match this query
    const sources = await SourceModel.findManyWithData(query, skip, range);
    //if no source found
    if (!sources.length) {
      //means nothing else is available
      return null;
    }

    for (const source of sources) {
      //it no data
      if (!Array.isArray(source.data) || !source.data.length) {
        //skip
        continue;
      }
      try {//to generate meme
        return await this.generate(
          consumer, 
          source, 
          service
        );
      } catch(e) {
        if (e instanceof Error && e.message === 'Not enough balance') {
          throw new Error('Not enough balance');
        }
        //it could fail if
        // - No faces were detected
        // - Frames length does not match source data length
      }
    }

    return await this.generateOne(consumer, query, service, skip + range, range);
  }

  /**
   * Searches for memes from tenor and caches it
   */
  public static async search(query: ObjectAny, wait = false) {
    //get query
    const search = new URLSearchParams({
      ...{ limit: '50' }, 
      ...query, 
      ...{
        client_key: 'tenorcept',
        key: TENOR_KEY as string
      }
    });
    const url = `https://tenor.googleapis.com/v2/search?${search.toString()}`;

    //get the results
    const results = await prisma.search.findUnique({ 
      where: { request: url } 
    });
    //if there are results
    if (results) {
      //return it
      return results;
    }
  
    //make the query
    const tenorResponse = await this._fetchJSON(url) as TenorResponse;
    //if there's an error
    if (tenorResponse.error?.message) {
      throw Exception.for(tenorResponse.error.message );
    //if there is no results
    } else if (!tenorResponse.results?.length) {
      //tenor might have results later in time...
      return { 
        request: url, 
        response: {
          results: [],
          next: ''
        } 
      };
    }

    //format search results
    const searchResults: SearchResult[] = []
    for (const row of tenorResponse.results) {
      searchResults.push({
        id: row.id,
        url: row.media_formats.gif.url,
        duration: row.media_formats.gif.duration,
        preview: row.media_formats.gif.preview,
        dims: row.media_formats.gif.dims || [],
        size: row.media_formats.gif.size,
        description: row.content_description,
        tags: row.tags || [],
        audio: row.hasaudio
      });
    }

    const searchResponse: SearchResponse = {
      results: searchResults,
      next: tenorResponse.next || ''
    };

    //for the row data
    const data = { request: url, response: searchResponse };
    
    //create a search item (we dont need to wait for this)
    if (wait) {
      await prisma.search.create({ data });
      await SourceModel.cache(url, searchResults);
    } else {
      prisma.search.create({ data }).then(async _ => {
        await SourceModel.cache(url, searchResults);
      });
    }

    //set the json response
    return data;
  }

  /**
   * Upates the CID of a source, if it's not already set
   */
  public static async vote(
    meme: number|string|Meme, 
    direction: Direction
  ) {
    //if source is a string
    if (typeof meme === 'string' || typeof meme === 'number') {
      //get source by url
      meme = await this.getOrThrow(meme);
    }

    const data: ObjectAny = {};
    if (direction == Direction.Up) {
      data.up = meme.up + 1;
    } else if (direction == Direction.Down) {
      data.down = meme.down + 1;
    }

    //vote now
    await SourceModel.vote(meme.sourceId, direction);
    return await prisma.meme.update({ where: { id: meme.id }, data });
  }

  /* Private Static Methods
  --------------------------------------------------------------------*/

  /**
   * Returns true if the consumer can consume a service
   */
  private static async _canConsume(
    consumer: Consumer, 
    totalBalance: BigNumber,
    rate: BigNumber
  ) {
    //check balance
    return parseInt(
      totalBalance
        .sub(BigNumber.from(consumer.consumed))
        .sub(rate)
        .toString()
    ) >= 0;
  }

  /**
   * Returns an Image given an index and a list of image urls
   */
  private static _chooseImage(images: any[], index: number) {
    return images[index % images.length]
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
   * Returns the JSON results of a url call
   */
  private static async _fetchJSON(url: string) {
    const response = await fetch(url);
    return response.json();
  }

  /**
   * Generates the meme
   */
  private static async _generate(consumer: Consumer, source: Source) {
    //if the source data is invalid
    if (!Array.isArray(source.data) || !source.data.length) {
      throw Exception.for('No faces were detected');
    }
  
    //choose a random face
    const face = await this._makeImage(
      this._chooseImage(
        consumer.images as string[], 
        Math.floor(Math.random() * 1000)
      )
    );
    const buffer = await GifFaces.getBuffer(source.url);
    const frames = GifFaces.getGifFrames(buffer);

    if (frames.length !== source.data.length) {
      throw Exception.for('Frames do not match source');
    }

    const { width, height } = frames[0].dims;
    const canvasImage = GifFaces.makeCanvasImage(width, height);
    const animation = new GIFEncoder(width, height);
    animation.start();

    for(let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      this._drawFrame(canvasImage, frame);
      const faces = source.data[i] as Box[];
      for (let j = 0; j < faces.length; j++) {
        //draw the face
        this._drawFace(canvasImage, face, faces[j]);
      }

      animation.setDelay(frame.delay || 0);
      animation.addFrame(canvasImage.context);
    }

    animation.finish();

    return animation;
  }
  
  /**
   * Converts a url src to an image object
   */
  private static _makeImage(src: string): Promise<Image> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = e => reject(e);
      image.src = src;
    })
  }

  /**
   * Uploads animation to Infura IPFS
   */
  private static _upload(animation: GIFEncoder): Promise<string> {
    return new Promise((resolve, reject) => {
      //make a form
      const form = new FormData();
      form.append('file', Readable.from(animation.out.getData()));
      //upload animation to CDN/IPFS
      fetch(`https://ipfs.infura.io:5001/api/v0/add`, {
        method: 'POST',
        headers: { 
          ...form.getHeaders(), 
          authorization: `Basic ${
            Buffer
              .from(`${INFURA_API_KEY}:${INFURA_API_SECRET}`)
              .toString('base64')
          }`
        },
        body: form
      })
      .then(response => response.json().then(json => resolve(json.Hash)))
      .catch(error => reject(error));
    });
  }
}