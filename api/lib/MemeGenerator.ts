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
  CanvasImage
} from '../utils/types';
//canvas node polyfills
import { Image } from '../utils/canvas';
//meme table ORM (mysql)
import { prisma, Prisma, Source, Consumer } from '../utils/prisma';
//expressive error reporting pattern
import Exception from './Exception';
//used to detect faces
import GifFaces from './GifFaces';
//used in generate to conume the tokens
import ServiceContract, { BigNumber } from './ServiceContract';

const { TENOR_KEY, INFURA_API_KEY, INFURA_API_SECRET } = process.env;

export default class MemeGenerator {
  /* Public Static Methods
  --------------------------------------------------------------------*/

  /**
   * Searches for memes from tenor and caches it
   */
  public static async search(query: ObjectAny) {
    //get query
    const search = new URLSearchParams({
      ...{ limit: '10' }, 
      ...query, 
      ...{
        client_key: 'tenorcept',
        key: TENOR_KEY as string
      }
    });
    const url = `https://tenor.googleapis.com/v2/search?${search.toString()}`;

    //get the results
    const results = await prisma.search.findUnique({ 
      where: { query: url } 
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
      return [];
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
    const data = { query: url, results: searchResponse };
    
    //create a search item (we dont need to wait for this)
    prisma.search.create({ data }).then(async _ => {
      //prepare source rows for insertion
      const rows: Prisma.SourceCreateInput[] = [];
      for (const row of searchResults) {
        rows.push({
          description: row.description,
          url: row.url,
          source: url,
          tags: row.tags
        });
      }
      //create many source rows
      await prisma.source.createMany({ data: rows});
    });

    //set the json response
    return data;
  }

  /**
   * Detects faces in gif urls and caches it
   */
  public static async detect(url: string) {
    //check if the source exists
    const sourceFromURL = await prisma.source.findUnique({ 
      where: { url } 
    });
    //if there is already data to this source
    if (sourceFromURL?.data) {
      //send the entire source
      return await this._updateSourceCID(sourceFromURL) ;
    }

    const gifFaces = new GifFaces();
    await gifFaces.setBufferFromURL(url);
    
    //get source
    const source = await this._getSourceFromCID(url, gifFaces.cid);
    //detect faces
    const faces = await gifFaces.detect();
    //if no faces
    if (!faces.length) {
      throw Exception.for('No faces found');
    }

    //update the source
    const results = await prisma.source.update({
      where: { id: source.id },
      data: { data: faces }
    });

    return results;  
  }

  /**
   * Generates custom faces on top of gif memes
   */
  public static async generate(
    walletAddress: string, 
    sourceURL: string,
    service: ServiceContract
  ) {
    //get the consumer
    const consumer = await prisma.consumer.findUniqueOrThrow(
      { where: { walletAddress }}
    );

    //get the source
    const source = await prisma.source.findUniqueOrThrow(
      { where: { url: sourceURL }}
    );
    //if the source data is invalid
    if (!Array.isArray(source.data) || !source.data.length) {
      throw Exception.for('Invalid source');
    }
    //check if sourceId already exists in meme
    const exists = await prisma.meme.findFirst({ where: { 
      consumerId: consumer.id, 
      sourceId: source.id 
    }});
    //if it does exists
    if (exists) {
      //then no need to do anything else
      //return exists;
    }
    //make sure the consumer has images
    if (!Array.isArray(consumer.images) || !consumer.images.length) {
      throw Exception.for('Consumer has no images');
    } 
    
    //get the total balance from the blockchain
    const totalBalance = await service.balanceOf(walletAddress);
    if (!(await this._canConsume(consumer, totalBalance, service.rate))) {
      throw Exception.for('Not enough balance');
    }

    //start generating
    const animation = await this._generate(consumer, source);
    const animationBuffer = animation.out.getData();
    const animationCID = await this._upload(animationBuffer);

    //now consume it
    await this._consume(consumer, totalBalance, service.rate);

    return await prisma.meme.create({ 
      data: {
        description: source.description,
        url: `${service.config.ipfs}/ipfs/${animationCID}`,
        cid: animationCID,
        tags: (source.tags as string[]) || [],
        sourceId: source.id,
        consumerId: consumer.id
      }
    });
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
    ) > 0;
  }

  /**
   * Consumes the service
   */
  private static async _consume(
    consumer: Consumer, 
    totalBalance: BigNumber,
    rate: BigNumber
  ) {
    return await prisma.consumer.update({
      where: { walletAddress: consumer.walletAddress },
      data: { 
        consumed: BigNumber
          .from(consumer.consumed)
          .add(rate)
          .toString() 
      }
    });
  }

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
      throw Exception.for('Invalid source');
    }
  
    const consumerImages = consumer.images as string[];
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
        //pick a face
        const face = await this._getModImage(consumerImages, j);
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
   * Returns an Image given an index and a list of image urls
   */
  private static _getModImage(
    images: string[], 
    index: number
  ): Promise<Image> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = e => reject(e);
      image.src = images[index % images.length];
    })
  }

  /**
   * Returns the source given the CID. If none exists, it will create one
   */
  private static async _getSourceFromCID(
    url: string, 
    cid: string
  ): Promise<Source> {
    //check if the source exists
    const source = await prisma.source.findUnique({ 
      where: { cid: cid } 
    });
  
    //if there is already data to this source
    if (source) {
      //send the entire source
      return source;
    }
  
    //let's create a source for this url
    return await prisma.source.upsert({
      where: { url }, 
      update: { cid },
      create: {
        url,
        cid,
        description: '',
        source: '',
        tags: []
      }
    });
  }
  
  /**
   * Upates the CID of a source, if it's not already set
   */
  private static async _updateSourceCID(source: Source): Promise<Source> {
    //if there's already a CID
    if (source.cid) {
      return source;
    }
  
    //load the url into a buffer
    const response = await fetch(source.url);
    const buffer = Buffer.from(await response.arrayBuffer()); 
    //get cid
    const cid = await GifFaces.getCID(buffer);
    //add the cid
    return await prisma.source.update({
      where: { id: source.id },
      data: { cid: cid }
    })
  }

  /**
   * Uploads a file to Infura IPFS
   */
  private static _upload(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      //make a form
      const form = new FormData();
      form.append('file', Readable.from(buffer));
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