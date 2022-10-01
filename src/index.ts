import dotenv from 'dotenv';
import app from './routes';

dotenv.config();

const port = 3000;

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})