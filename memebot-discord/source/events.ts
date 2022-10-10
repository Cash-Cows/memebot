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

/*
/meme-register wallet:0xD7D190cdC6A7053CD5Ee76E966a1b9056dbA4774 proof:0xcfadf319fbfcf8a092c28e64862327d908d207998c945b9f4489af1b5b4cb22f0a97536c39510a93c0fd85c751c3f81dddfd89361675be9c64c2b3ec8cdb242a1c image1:https://media.discordapp.net/attachments/1026399782689853440/1026399782815666186/meme-cow-1.png image2:https://media.discordapp.net/attachments/1026399782689853440/1026399783113469972/meme-cow-2.png
*/

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
  reply(res, 'Registering...');

  //make the api call
  const response = await tryTo(async () => {
    return await api.get(`/register?${params.toString()}`);
  });

  if (!response) {
    return await tryTo(async () => {
      return await discord.post(
        `/webhooks/${interaction.application_id}/${interaction.token}`,
        message('Server looks to be down now.').data
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

  //const final  = await tryTo(async () => {
    return await discord.post(
      `/webhooks/${interaction.application_id}/${interaction.token}`,
      message('Successfully registered!').data
    )
  //});

  //console.log(final)
});

emitter.on('meme-start', async function(req, res, interaction) {
  //generate a url from the server
  const sessionURL = 'https://www.wearecashcows.com/memebot.html';
  return reply(
    res, 
    `Before you start generating memes, you need to first connect your wallet and load some $MILK. ${sessionURL}`
  );
});

emitter.on('meme', function(req, res, interaction) {
  //query:
  //console.log(interaction.data.options[0].value)
  
  return reply(res, `Yo ${interaction.member.user.username}!`);
});

export default emitter;