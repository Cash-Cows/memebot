import { 
  //instances
  prisma,
  emitter,
  //functions
  remit,
  //classes
  FaceSmash,
  InceptRequest, 
  InceptResponse,
  //generic types
  ObjectAny,
  //prisma types
  Prisma, 
  SourceType
} from '../utils';

emitter.on('source-detail', async (
  req: InceptRequest, 
  res: InceptResponse
) => {
  const { id, url, cid, upsert } = req.params;
  const where: ObjectAny = {};
  if (id) {
    where.id = id;
  } else if (url) {
    where.url = url;
  } else if (cid) {
    where.cid = cid;
  }
  
  const results = await prisma.source.findUniqueOrThrow({ where });

  if (!results && upsert) {
    return await remit('source-upsert', req, res);
  }

  res.write({ error: false, results });
});

emitter.on('source-search', async (
  req: InceptRequest, 
  res: InceptResponse
) => {
  const { q, detected, start, range } = req.params;
  const where: ObjectAny = {};
  if (detected) {
    where.data = { not: Prisma.JsonNull };
  }
  if (q) {
    where.OR = [
      { description: { contains: q } },
      { tags: { array_contains: [ q ] } }
    ];
  }
  const results = await prisma.source.findMany({
    where,
    skip: start,
    take: range
  });

  res.write({ error: false, results });
});

emitter.on('source-upsert', async (
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

  const create: Prisma.SourceCreateInput = {
    url,
    cid: cid || null,
    description: req.params.description || '',
    source: req.params.source || '',
    tags: req.params.tags || [],
    data: req.params.data || null
  };

  const update: ObjectAny = {};
  for (const key of ['cid', 'description', 'source', 'tags', 'data']) {
    if (req.params[key]) {
      update[key] = req.params[key];
    }
  }

  const results = await prisma.source.upsert({ where, update, create });

  res.write({ error: false, results });
});

emitter.on('source-detect-faces', async (
  req: InceptRequest, 
  res: InceptResponse
) => {
  let source: string|SourceType = req.params.source
  //load gif face detect
  const faceSmash = new FaceSmash();
  //determine the URL
  const url: string = typeof source === 'string' ? source: source.url;

  //make sure we have a source (wether found or created)
  //if source is the url
  if (typeof source === 'string') {
    //check if the source exists
    const sourceFromURL = await remit('source-detail', { url });
    //if a source was found
    if (sourceFromURL) {
      source = sourceFromURL as SourceType;
    } else {
      await faceSmash.setBufferFromURL(url);
      //make sure there is a CID
      source = await remit('source-detail', {
        cid: faceSmash.cid,
        upsert: true
      }) as SourceType;
    }
  }
  
  //if there is already data to this source
  if (typeof source !== 'string' && source.data) {
    if (!source.cid) {
      //load the buffer and cid
      await faceSmash.setBufferFromURL(url);
      //add the cid
      await remit('source-upsert', { url, cid: faceSmash.cid });
      source.cid = faceSmash.cid;
    }

    return res.write({ error: false, results: source });
  }

  //if no cid (means there's no buffer)
  if (!faceSmash.cid?.length) {
    //load the buffer and cid
    await faceSmash.setBufferFromURL(url);
  }

  //detect faces
  const faces = await faceSmash.detect();

  //update the source
  const results = await remit('source-upsert', {
    url,
    cid: faceSmash.cid,
    data: faces
  });

  res.write({ error: false, results });
});