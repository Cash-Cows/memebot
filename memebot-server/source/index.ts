import { app } from './utils';
import './routes';
import './events';

//port setup
const port = process.env.PORT || 3001;
//now http listen on port
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})