import { 
  //instances
  prisma,
  emitter,
  service,
  InceptRequest, 
  InceptResponse,
  //generic types
  ObjectAny,
  //blockchain types
  BigNumber,
  //prisma types
  Prisma
} from '../utils';

emitter.on('consumer-detail', async (
  req: InceptRequest, 
  res: InceptResponse
) => {
  const { id, discordId, walletAddress } = req.params;
  const where: ObjectAny = {};
  if (id) {
    where.id = id;
  } else if (walletAddress) {
    where.walletAddress = walletAddress;
  } else if (discordId) {
    where.discordId = discordId;
  }
  
  const consumer = await prisma.consumer.findUniqueOrThrow({ where });
  const balance = await service.balanceOf(consumer.walletAddress);
  const consumed = BigNumber.from(consumer.consumed);

  res.write({ 
    error: false, 
    results: {
      ...consumer, 
      loadedBalance: balance.toString(), 
      availableBalance: balance.sub(consumed).toString() ,
      serviceRate: service.rate.toString()
    }
  });
});

emitter.on('consumer-upsert', async (
  req: InceptRequest, 
  res: InceptResponse
) => {
  const { id, discordId, walletAddress } = req.params;
  const where: ObjectAny = {};
  if (id) {
    where.id = id;
  } else if (walletAddress) {
    where.walletAddress = walletAddress;
  } else if (discordId) {
    where.discordId = discordId;
  }

  const create: Prisma.ConsumerCreateInput = {
    walletAddress: req.params.walletAddress, 
    discordId: req.params.discordId, 
    images: req.params.images || []
  };

  const update: ObjectAny = {};
  for (const key of ['walletAddress', 'discordId', 'images', 'consumed']) {
    if (req.params[key]) {
      update[key] = req.params[key];
    }
  }

  const results = await prisma.consumer.upsert({ where, update, create });

  res.write({ error: false, results });
});