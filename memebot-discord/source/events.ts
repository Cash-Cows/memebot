import {
  axios,
  commands,
  applicationId,
  guildId,
  InteractionResponseType,
} from './boot';
import EventEmitter from 'events';

const emitter = new EventEmitter();

emitter.on('commands', async function(req, res) {
  try {
    await axios.put(
      `/applications/${applicationId}/guilds/${guildId}/commands`,
      commands
    )
    return res.send('commands have been registered')
  } catch(e) {
    console.error(e)
    return res.send('500 error from discord')
  }
});

emitter.on('meme', function(req, res, interaction) {
  res.send({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: `Yo ${interaction.member.user.username}!`,
    },
  })
});

export default emitter;