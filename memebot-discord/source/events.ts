import {
  api,
  discord,
  commands,
  reply,
  message,
  tryTo,
  applicationId,
  guildId,
  Web3,
  toOptionsHash
} from './boot';
import EventEmitter from 'events';

const emitter = new EventEmitter();
const web3 = new Web3();

emitter.on('commands', async function(req, res) {
  try {
    await discord.put(
      `/applications/${applicationId}/guilds/${guildId}/commands`,
      commands
    )
    return res.send('commands have been registered')
  } catch(e) {
    console.error(e)
    return res.send('500 error from discord')
  }
});

emitter.on('meme-register', async function(req, res, interaction) {
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
    return reply(res, 'Invalid verification.');
  }

  //make url parameters
  const params = new URLSearchParams();
  params.append('wallet', options.wallet);
  params.append('discordId', interaction.member.user.id);
  params.append('image', options.image1);
  if (options.image2) {
    params.append('image', options.image2);
  }
  if (options.image3) {
    params.append('image', options.image3);
  }

  //there's a 3 sec limit
  reply(res, `Registering ${interaction.member.user.username}...`);

  //make the api call
  const response = await tryTo(async () => {
    return await api.get(`/register?${params.toString()}`);
  });

  if (!response) {
    return await tryTo(async () => {
      return await discord.post(
        `/webhooks/${interaction.application_id}/${interaction.token}`,
        message(`Sorry ${
          interaction.member.user.username
        }, server looks to be down now.`).data
      );
    })
  } else if (response.error) {
    return await tryTo(async () => {
      return await discord.post(
        `/webhooks/${interaction.application_id}/${interaction.token}`,
        message(response.message).data
      )
    });
  }

  await tryTo(async () => {
    return await discord.post(
      `/webhooks/${interaction.application_id}/${interaction.token}`,
      message(`${
        interaction.member.user.username
      } successfully registered!`).data
    )
  });
});

emitter.on('meme-start', async function(req, res, interaction) {
  //generate a url from the server
  const sessionURL = 'https://www.wearecashcows.com/memebot.html';
  return reply(
    res, 
    `Before you start generating memes, you need to first connect your wallet and load some $MILK. ${sessionURL}`
  );
});

emitter.on('meme', async function(req, res, interaction) {
  //there's a 3 sec limit
  reply(res, `Generating "${interaction.data.options[0].value}" for ${
    interaction.member.user.username
  }. This might take a few min...`);

  const options = toOptionsHash(interaction.data.options);

  //make url parameters
  const params = new URLSearchParams();
  params.append('q', options.query);
  params.append('key', interaction.member.user.id);
  if (options.next) {
    params.append('skip', options.next);
  }

  //make the api call
  const response = await tryTo(async () => {
    return await api.get(`/discord/search?${params.toString()}`);
  });
  
  if (!response.data) {
    return await tryTo(async () => {
      return await discord.post(
        `/webhooks/${interaction.application_id}/${interaction.token}`,
        message(`Sorry ${
          interaction.member.user.username
        }, server looks to be down now.`).data
      );
    })
  } else if (response.data.error) {
    return await tryTo(async () => {
      return await discord.post(
        `/webhooks/${interaction.application_id}/${interaction.token}`,
        message(response.data.message).data
      )
    });
  } else if (!response.data.results?.url) {
    return await tryTo(async () => {
      return await discord.post(
        `/webhooks/${interaction.application_id}/${interaction.token}`,
        message(`Sorry ${
          interaction.member.user.username
        }, no more results for "${interaction.data.options[0].value}".`).data
      )
    });
  }

  await tryTo(async () => {
    return await discord.post(
      `/webhooks/${interaction.application_id}/${interaction.token}`,
      message(response.data.results.url).data
    )
  });
});

export default emitter;