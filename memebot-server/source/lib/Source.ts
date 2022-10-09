//used to get content identfiers of file buffers (sent to db)
import CID from 'ipfs-only-hash';

//centralized type defs
import { Box, SearchResult, Direction, ObjectAny } from '../utils/types';
//consumer table ORM (mysql)
import { prisma, Prisma, Source as SourceType } from '../utils/prisma';

export default class Source {
  /* Public Static Methods
  --------------------------------------------------------------------*/

  /**
   * Upates the CID of a source, if it's not already set
   */
  public static async addCID(source: SourceType, cid: string|null = null) {
    //if there's already a CID
    if (source.cid) {
      return source;
    }
    //if no cid provided
    if (!cid) {
      //load the url into a buffer
      const response = await fetch(source.url);
      const buffer = Buffer.from(await response.arrayBuffer()); 
      //get cid
      cid = await CID.of(buffer);
    }
    //add the cid
    return await prisma.source.update({
      where: { id: source.id },
      data: { cid: cid }
    });
  }

  /**
   * Caches the given Tenor results
   */
  public static async cache(url: string, results: SearchResult[]) {
    //prepare source rows for insertion
    const rows: Prisma.SourceCreateInput[] = [];
    for (const row of results) {
      rows.push({
        description: row.description,
        url: row.url,
        source: url,
        tags: row.tags
      });
    }
    //get the dupes
    const dupes = (
      await prisma.source.findMany({ 
        where: { 
          //get just the url, then format it to filter by the url
          OR: rows.map(row => row.url).map(url => ({ url })) 
        } 
      })
    //then we just need the urls
    ).map(row => row.url);
    //make filtered rows less the duplicates
    const filtered = rows.filter(row => dupes.indexOf(row.url) === -1);
    //if there are still rows
    if (filtered.length) {
      //create many source rows
      await prisma.source.createMany({ data: filtered });
    }
  }

  /**
   * Adds face detections to the source
   */
  public static async detect(
    url: string, 
    faces: Box[][], 
    cid: string|null = null
  ) {
    const data: ObjectAny = { data: faces };
    if (cid) {
      data.cid = cid;
    }
    return await prisma.source.update({ where: { url }, data });
  }

  /**
   * Returns source info given the url
   */
  public static async get(id: number|string) {
    const where: ObjectAny = {};
    if (typeof id === 'string') {
      where.url = id;
    } else {
      where.id = id
    }
    return await prisma.source.findUnique({ where });
  }

  /**
   * Returns source info given the url
   */
  public static async getOrThrow(id: number|string) {
    const where: ObjectAny = {};
    if (typeof id === 'string') {
      where.url = id;
    } else {
      where.id = id
    }
    return await prisma.source.findUniqueOrThrow({ where });
  }

  /**
   * Returns the source given the CID. If none exists, it will create one
   */
  public static async makeFromCID(url: string, cid: string) {
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
   * Returns the first row that matches the query
   */
  public static async findManyWithData(
    query: string, 
    skip: number = 0,
    take: number = 25
  ) {
    return await prisma.source.findMany({ 
      where: { 
        data: { not: Prisma.JsonNull },
        OR: [
          { description: { contains: query } },
          { tags: { array_contains: [ query ] } }
        ]
      },
      skip,
      take
    });
  }

  /**
   * Returns all the results that match the given source url
   */
  public static async findManyWithNoData(
    skip: number = 0, 
    take: number = 100
  ) {
    return await prisma.source.findMany({ 
      where: { cid: null },
      skip, 
      take
    });
  }

  /**
   * Returns all the results that match the given source url
   */
  public static async findManyWithSource(source: string) {
    return await prisma.source.findMany({ where: { source } });
  }

  /**
   * Upates the CID of a source, if it's not already set
   */
  public static async vote(
    source: number|string|SourceType, 
    direction: Direction
  ) {
    //if source is a string
    if (typeof source === 'string' || typeof source === 'number') {
      //get source by url
      source = await this.getOrThrow(source);
    }
    const data: ObjectAny = {};
    if (direction == Direction.Up) {
      data.up = source.up + 1;
    } else if (direction == Direction.Down) {
      data.down = source.down + 1;
    }
    //vote now 
    return await prisma.source.update({ where: { id: source.id }, data });
  }
}