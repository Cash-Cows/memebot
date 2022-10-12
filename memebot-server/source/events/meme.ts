import { 
  //variables
  env,
  //instances
  prisma,
  emitter,
  service,
  //axios
  axios,
  infura,
  //functions
  remit,
  //classes
  Readable,
  FormData,
  Exception,
  FaceSmash,
  InceptRequest, 
  InceptResponse,
  //generic types
  ObjectAny,
  //canvas types
  Box, 
  //blockchain types
  BigNumber, 
  IPFSResponse,
  //tenor types
  TenorResponse,
  TenorSearchResult,
  TenorSearchResponse, 
  //prisma types
  Prisma, 
  SourceType, 
  ConsumerType,
  Direction
} from '../utils';

emitter.on('meme-cache', async (
  req: InceptRequest, 
  res: InceptResponse
) => {
  const url = req.params.url;
  const results: TenorSearchResult[] = req.params.results;
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
    const results = await prisma.source.createMany({ data: filtered });
    res.write({ error: false, results });
  } else {
    res.write({ error: false, results: [] });
  }
});

emitter.on('meme-generate', async (
  req: InceptRequest, 
  res: InceptResponse
) => {
  let consumer: string|ConsumerType = req.params.consumer;
  let source: string|SourceType = req.params.source;

  //get the consumer
  if (typeof consumer === 'string') {
    if (consumer.indexOf('0x') === 0) {
      consumer = await remit('consumer-detail', { 
        walletAddress: consumer 
      }) as ConsumerType;
    } else {
      consumer = await remit('consumer-detail', { 
        discordId: consumer 
      }) as ConsumerType;
    }
  }
  //get the source
  if (typeof source === 'string') {
    if (source.indexOf('http') === 0) {
      source = await remit('source-detail', { 
        url: source 
      }) as SourceType;
    } else {
      source = await remit('source-detail', { 
        cid: source 
      }) as SourceType;
    }
  }
  //check if sourceId already exists in meme
  const exists = await prisma.meme.findFirst({ where: { 
    consumerId: consumer.id, 
    sourceId: source.id 
  }});
  //if it does exists
  if (exists) {
    //then no need to do anything else
    return res.write({ error: false, results: exists });
  }
  //make sure the consumer has images
  if (!Array.isArray(consumer.images) || !consumer.images.length) {
    return res.write({ error: true, message: 'Consumer has no images' });
  } 
  //get the total balance from the blockchain
  const totalBalance = await service.balanceOf(consumer.walletAddress);
  if (parseInt(
    totalBalance
      .sub(BigNumber.from(consumer.consumed))
      .sub(service.rate)
      .toString()
  ) < 0) {
    throw Exception.for('Not enough balance');
  }

  const face = consumer.images[
    Math.floor(Math.random() * 1000) % consumer.images.length
  ] as string;
  const detections = source.data as Box[][];
  const animation = await FaceSmash.pasteFaces(source.url, face, detections);

  //make a form
  const form = new FormData();
  form.append('file', Readable.from(animation.out.getData()), 'meme.gif');
  //upload animation to CDN/IPFS
  const response = await infura.post('/add?wrap-with-directory=true', form, {
    headers: { 
      ...form.getHeaders(), 
      authorization: `Basic ${
        Buffer
          .from(`${env.infuraKey}:${env.infuraSecret}`)
          .toString('base64')
      }`
    }
  });

  const json: IPFSResponse[] = JSON.parse(`[${
    response.data.replace("}\n{", '},{').trim()
  }]`);

  const file = {
    cid: json[0].Hash,
    path: `/${json[1].Hash}/${json[0].Name}` 
  };
  
  //start generating

  //now consume it
  await remit('consumer-upsert', {
    walletAddress: consumer.walletAddress,
    consumed: BigNumber
      .from(consumer.consumed)
      .add(service.rate)
      .toString() 
  });

  const results = await prisma.meme.create({ 
    data: {
      description: source.description,
      url: `${service.config.ipfs}/ipfs${file.path}`,
      cid: file.cid,
      tags: (source.tags as string[]) || [],
      sourceId: source.id,
      consumerId: consumer.id
    }
  });

  res.write({ error: false, results });
});

emitter.on('meme-search', async (
  req: InceptRequest, 
  res: InceptResponse
) => {
  const { q, start, range } = req.params;
  const where: ObjectAny = {};
  if (q) {
    where.OR = [
      { description: { contains: q } },
      { tags: { array_contains: [ q ] } }
    ];
  }
  const results = await prisma.meme.findMany({
    where,
    skip: start,
    take: range
  });

  res.write({ error: false, results });
});

emitter.on('meme-search-tenor', async (
  req: InceptRequest, 
  res: InceptResponse
) => {
  //get query
  const params = new URLSearchParams({
    ...{ limit: '50' }, 
    ...req.params.query, 
    ...{
      client_key: env.tenorClient,
      key: env.tenorKey
    }
  });
  const url = `https://tenor.googleapis.com/v2/search?${params.toString()}`;

  //get the results
  const results = await prisma.search.findUnique({ 
    where: { request: url } 
  });
  //if there are results
  if (results) {
    //return it
    return res.write({ error: false, results });
  }

  //make the query
  const response = await axios.get(url);
  const json = response.data as TenorResponse;
  //if there's an error
  if (json.error?.message) {
    return res.write({ error: true, message: json.error.message });
  //if there is no results
  } else if (!json.results?.length) {
    //tenor might have results later in time...
    return res.write({ 
      error: false, 
      results: { 
        request: url, 
        response: {
          results: [],
          next: ''
        } 
      } 
    });
  }

  //format search results
  const searchResults: TenorSearchResult[] = []
  for (const row of json.results) {
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

  const searchResponse: TenorSearchResponse = {
    results: searchResults,
    next: json.next || ''
  };

  //for the row data
  const data = { request: url, response: searchResponse };
  
  //create a search item (we dont need to wait for this)
  if (req.params.wait) {
    await prisma.search.create({ data });
    await remit('meme-cache', { url, results: searchResults });
  } else {
    prisma.search.create({ data }).then(async _ => {
      await remit('meme-cache', { url, results: searchResults });
    });
  }

  //set the json response
  res.write({ error: false, results: data });
});

emitter.on('meme-vote', async (
  req: InceptRequest, 
  res: InceptResponse
) => {
  const { id, url, cid } = req.params;
  const where: ObjectAny = {};
  if (id) {
    where.id = id;
  } else if (url) {
    where.url = url;
  } else if (cid) {
    where.cid = cid;
  }

  //first get
  const meme = await prisma.meme.findUniqueOrThrow({ where })

  const data: ObjectAny = {};
  if (req.params.direction === Direction.Down) {
    data.down = meme.down + 1;
  } else {
    data.up = meme.up + 1;
  }

  const results = await prisma.meme.update({ where, data });

  res.write({ error: false, results });
});

export default emitter;