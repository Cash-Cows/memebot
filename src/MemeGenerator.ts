import { prisma, Prisma, Source } from './prisma';

import https from 'https';
import fetch from 'node-fetch';
import GIFEncoder from 'gif-encoder-2';

import {
  Box,
  TenorResponse,
  SearchResult,
  SearchResponse,
  ObjectAny
} from './types';
import { Image } from './canvas';
import Exception from './Exception';
import GifFaces from './GifFaces';

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
  public static async generate(walletAddress: string, sourceURL: string) {
    //get the consumer
    const consumer = await prisma.consumer.findUnique(
      { where: { walletAddress }}
    );
    //if the consumer does not exist
    if (!consumer) {
      throw Exception.for('Invalid consumer');
    }

    //get the source
    const source = await prisma.source.findUnique(
      { where: { url: sourceURL }}
    );
    //if the source does not exist
    if (!source || !Array.isArray(source.data) || !source.data.length) {
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
      return exists;
    }

    //make sure the consumer has images
    if (!Array.isArray(consumer.images) || !consumer.images.length) {
      throw Exception.for('Consumer has no images');
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
      const faces = source.data[i] as Box[];
      for (let j = 0; j < faces.length; j++) {
        //pick an image
        const consumerImage = await this._getModImage(consumerImages, j);
        canvasImage.canvas.getContext('2d').drawImage(
          consumerImage, 
          0, 0, consumerImage.width, consumerImage.height,
          faces[i].x,
          faces[i].y,
          faces[i].width,
          faces[i].height
        )
      }

      animation.setDelay(frame.delay || 0);
      animation.addFrame(canvasImage.context);
    }

    animation.finish();

    const animationBuffer = animation.out.getData();
    const animationCID = await this._upload(animationBuffer);

    const data = {
      description: source.description,
      url: `https://ipfs.io/ipfs/${animationCID}`,
      cid: animationCID,
      tags: (source.tags as string[]) || [],
      sourceId: source.id,
      consumerId: consumer.id
    };

    return await prisma.meme.create({ data });
  }

  /* Private Static Methods
  --------------------------------------------------------------------*/

  /**
   * Returns the JSON results of a url call
   */
  private static async _fetchJSON(url: string) {
    const response = await fetch(url);
    return response.json();
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
      //upload animation to CDN/IPFS
      const request = https.request('https://ipfs.infura.io:5001/api/v0/add', {
        method: 'POST',
        auth: `${INFURA_API_KEY}:${INFURA_API_SECRET}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': buffer.length
        }
      }, (response) => response.on('end', () => {
        GifFaces.getCID(buffer).then(resolve);
      }));

      request.on('error', (error) => reject(error));
      request.write(buffer);
      request.end();
    });
  }
  
  /**
   * Returns the source given the CID. If none exists, it will create one
   */
  private static async _getSourceFromCID(url: string, cid: string): Promise<Source> {
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
}