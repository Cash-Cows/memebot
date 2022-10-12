import {
  //instances
  app,
  //functions
  reply,
  remit,
  verify,
  //discord types
  InteractionType
} from '../utils';

app.post('/interactions', verify, async (req, res) => {
  const interaction = req.body;
  if (interaction.type !== InteractionType.APPLICATION_COMMAND) {
    return reply(res, 'Not sure');
  }

  remit(`discord-${interaction.data.name}`, { interaction })
    .then(results => {
      //console.log(results)
      reply(res, results)
    })
    .catch(error => reply(res, error.message));
});

app.get('/discord/register_commands', async (req, res) =>{
  remit('discord-commands', {})
    .then(results => res.json({ error: false, results }))
    .catch(error => res.json({ error: true, message: error.message }));
});