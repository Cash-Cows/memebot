import { app, verify, InteractionType } from './boot';
import events from './events';

app.post('/interactions', verify, async (req, res) => {
  const interaction = req.body;

  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    events.emit(interaction.data.name, req, res, interaction);
  }
});

app.get('/register_commands', async (req, res) =>{
  events.emit('commands', req, res);
});

app.get('/', (req, res) => res.send('Want some memes?'));

app.listen(8999, () => {});