import {
  //variables
  models,
  //instances
  app,
  service,
  //classes
  FaceSmash,
  //blockchain types
  BigNumber,
  Direction,
  remit,
  //tenor types
  TenorSearchResponse
} from '../utils';

/**
 * Example: /ping
 */
app.get('/api/ping', async (req, res) => {
  res.json({ error: false, results: 'pong' });
});

/**
 * Example: /register
 * ?image=https://www.wearecashcows.com/images/collection/3283_0.png
 * &image=https://www.wearecashcows.com/images/collection/411_0.png
 * &wallet=0xbF77342243B2f6dfb7a0b37793b0ffdEeF669bb8
 */
app.get('/api/register', async (req, res) => {
  //if no wallet address
  if (!req.query?.wallet) {
    return res.json({ error: true, message: 'Wallet address missing' });
  //if no images
  } else if (!req.query?.image) {
    return res.json({ error: true, message: 'Images missing' });
  } else if (!req.query?.discordId) {
    return res.json({ error: true, message: 'Discord ID missing' });
  }

  const images = Array.isArray(req.query.image) 
    ? req.query.image as string[]
    : [ req.query.image ] as string[];

  const walletAddress = String(req.query.wallet);
  const discordId = String(req.query.discordId);

  remit('consumer-upsert', { walletAddress, discordId, images })
    .then(results => res.json({ error: false, results }))
    .catch(error => res.json({ error: true, message: error.message }));
});

/**
 * Example: /user?wallet=0xbF77342243B2f6dfb7a0b37793b0ffdEeF669bb8
 */
app.get('/api/user', async (req, res) => {
  //if no id, wallet address and discordId 
  if (!req.query?.id && !req.query?.wallet && !req.query?.discordId) {
    return res.json({ error: true, message: 'Wallet address missing' });
  }

  if (req.query.wallet) {
    req.query.walletAddress = req.query.wallet;
  }

  remit('consumer-detail', req.query)
    .then(results => res.json({ error: false, results }))
    .catch(error => res.json({ error: true, message: error.message }));
});

/**
 * Example: /search?q=pump&limit=10
 */
app.get('/api/search', (req, res) => {
  if (!req.query?.q) return res.json({ 
    error: true, 
    message: 'Query missing' 
  });

  remit('meme-search-tenor', { query: req.query})
    //@ts-ignore
    .then(search => {
      const response = search.response as TenorSearchResponse;
      res.json({ 
        error: false, 
        results: response.results,
        next: response.next
      })
    })
    .catch(error => res.json({ error: true, message: error.message }));
});

/**
 * Example: /detect
 * ?url=https://media.tenor.com/XxOtj-aoQeMAAAAC/bodybuilder-bodybuilding.gif
 */
app.get('/api/detect', (req, res) => {
  //if no URL was provided
  if (!req.query?.url) {
    //return error response
    return res.json({ error: true, message: 'URL missing' });
  //still loading?
  } else if (!FaceSmash.modelsAreLoaded(models)) {
    //return error response
    return res.json({ error: true, message: 'AI still loading' });
  }

  remit('source-detect-faces', { source: req.query.url })
    .then(results => res.json({ error: false, results }))
    .catch(error => res.json({ error: true, message: error.message })); 
});

/**
 * Example: /generate
 * ?key=0xbF77342243B2f6dfb7a0b37793b0ffdEeF669bb8
 * &url=https://media.tenor.com/XxOtj-aoQeMAAAAC/bodybuilder-bodybuilding.gif
 */
app.get('/api/generate', (req, res) => {
  //if no wallet address was provided
  if (typeof req.query?.key !== 'string') {
    //return error response
    return res.json({ error: true, message: 'API key missing' });
  //if no url was provided
  } else if (typeof req.query?.url !== 'string') {
    //return error response
    return res.json({ error: true, message: 'URL missing' });
  }

  const walletAddress = req.query.key as string;

  remit('meme-generate', { 
    source: req.query.url, 
    consumer: walletAddress 
  })
  .then(results => res.json({ error: false, results }))
  .catch(error => {
    console.log(error)
    res.json({ error: true, message: error.message })
  }); 
});

/**
 * Example: /vote/up
 * ?url=https://ccmemebot.infura-ipfs.io/ipfs/QmUzFECFujRyA52XDFTQqszppYVqTmd6kxnVvXFBBQg6GW
 */
app.get('/api/vote/up', (req, res) => {
  if (!req.query?.url) {
    return res.json({ error: true, message: 'URL missing' });
  }

  const url = req.query.url as string;

  remit('meme-vote', { url, direction: Direction.Up })
    .then(results => res.json({ error: false, results }))
    .catch(error => res.json({ error: true, message: error.message })); 
});

/**
 * Example: /vote/down
 * ?url=https://ccmemebot.infura-ipfs.io/ipfs/QmUzFECFujRyA52XDFTQqszppYVqTmd6kxnVvXFBBQg6GW
 */
app.get('/api/vote/down', (req, res) => {
  if (!req.query?.url) {
    return res.json({ error: true, message: 'URL missing' });
  }

  const url = req.query.url as string;

  remit('meme-vote', { url, direction: Direction.Down })
    .then(async results => {
      //refund rules (down voted 10 times and never up voted)
      if (!results.up && results.down === 10) {
        const consumer = await remit('consumer-detail', { 
          id: results.consumerId 
        });

        await remit('consumer-upsert', {
          walletAddress: consumer.walletAddress,
          consumed: BigNumber
            .from(consumer.consumed)
            .sub(service.rate)
            .toString() 
        });
      }
      res.json({ error: false, results })
    })
    .catch(error => res.json({ error: true, message: error.message })); 
});