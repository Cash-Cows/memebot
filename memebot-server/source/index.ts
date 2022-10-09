//for the .env file
import dotenv from 'dotenv';
//get the express app
import app from './routes';

//dot env setup
dotenv.config();
//port setup
const port = process.env.PORT || 3001;
//now http listen on port
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})