import {
  //variables
  env,
  commands,
  //instances
  emitter,
  //axios
  discord,
  //functions
  remit,
  tryTo,
  message,
  toOptionsHash,
  //classes
  Web3,
  InceptRequest, 
  InceptResponse,
  //general types
  ObjectAny,
  ConsumerType
} from '../utils';

const web3 = new Web3();

emitter.on('discord-commands', async (
  req: InceptRequest, 
  res: InceptResponse
) => {
  await discord.put(
    `/applications/${env.discordApplicationId}/guilds/${env.discordGuildId}/commands`,
    commands
  );

  res.write({ error: false, results: 'commands have been registered' });
});

emitter.on('discord-meme-start', async (
  req: InceptRequest, 
  res: InceptResponse
) => {
  //generate a url from the server
  const sessionURL = 'https://www.wearecashcows.com/memebot.html';
  res.write({ 
    error: false, 
    results: `Before you start generating memes, you need to first connect your wallet and load some $MILK. ${sessionURL}`
  });
});

emitter.on('discord-meme-register', async (
  req: InceptRequest, 
  res: InceptResponse
) => {
  const { interaction } = req.params;
  const options = toOptionsHash(interaction.data.options);
  //make a message
  //check proof
  const address = await tryTo(() => {
    return web3.eth.accounts.recover(
      //@ts-ignore
      web3.utils.sha3(
        web3.utils.toHex('cashcowsmoo') as string, 
        //@ts-ignore
        { encoding: 'hex' }
      ), 
    options.proof)
  });
  //if no address or if it doesn't match
  if (!address || address.toLowerCase() !== options.wallet.toLowerCase()) {
    return res.write({ error: true, message: 'Invalid verification.' });
  }

  //make params
  const params = {
    walletAddress: options.wallet,
    discordId: interaction.member.user.id,
    images: [ options.image1 ]
  };
  if (options.image2) {
    params.images.push(options.image2);
  }
  if (options.image3) {
    params.images.push(options.image3);
  }

  //there's a 3 sec limit
  res.write({ 
    error: false, 
    results: `Registering ${interaction.member.user.username}...` 
  });

  //try to register
  tryTo(() => remit('consumer-upsert', params))
  .then(() => discord.post(
    `/webhooks/${interaction.application_id}/${interaction.token}`,
    message(`${
      interaction.member.user.username
    } successfully registered!`).data
  ))
  .catch(error => discord.post(
    `/webhooks/${interaction.application_id}/${interaction.token}`,
    message(error.message).data
  ));
});

emitter.on('discord-meme', async (
  req: InceptRequest, 
  res: InceptResponse
) => {
  const { interaction } = req.params;
  //there's a 3 sec limit
  res.write({ 
    error: false, 
    results: `Generating "${interaction.data.options[0].value}" for ${
      interaction.member.user.username
    }. This might take a few min...`
  });

  const makeRecurse = (consumer: ConsumerType) => {
    const recurse = async function(): Promise<string> {
      const sources = await remit('source-search', params);
      //if no source found
      if (!sources.length) {
        //means nothing else is available
        return `Sorry ${
          interaction.member.user.username
        }, no more results for "${interaction.data.options[0].value}".`;
      }
  
      for (const source of sources) {
        //it no data
        if (!Array.isArray(source.data) || !source.data.length) {
          //skip
          continue;
        }
        try {//to generate meme
          const results = await remit('meme-generate', { consumer, source });
          return results.url;
          
        } catch(e) {
          if (e instanceof Error && e.message === 'Not enough balance') {
            return 'Not enough balance';
          }
          //it could fail if
          // - No faces were detected
          // - Frames length does not match source data length
        }
      }
  
      params.start++;
      return await recurse();
    };

    return recurse;
  }

  //make params
  const options = toOptionsHash(interaction.data.options);
  const params: ObjectAny = { q: options.query, range: 1 };
  params.start = parseInt(options.next || '0');

  remit('consumer-detail', { 
    discordId: interaction.member.user.id 
  })
  .then(consumer => {
    const recurse = makeRecurse(consumer);
    tryTo(async() => await recurse())
      .then(content => discord.post(
        `/webhooks/${interaction.application_id}/${interaction.token}`,
        message(content).data
      ))
      .catch(error => discord.post(
        `/webhooks/${interaction.application_id}/${interaction.token}`,
        message(error.message).data
      ));
  });
});