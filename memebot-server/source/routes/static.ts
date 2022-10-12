//used to resolve the models path
import path from 'path';

import {
  //variables
  app,
  //functions
  express,
} from '../utils';

//declare some routes

app.use(express.static(path.resolve(__dirname, '../../public')));

/**
 * Example: /
 */
app.get('/', async (req, res) => {
  res.send('Want some memes?');
});