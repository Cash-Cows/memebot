//used to resolve the models path
import path from 'path';
//http routing
import express from 'express';
//the config for the service contract
import serviceConfig from './service.json';
//importing this to load the models
import GifFaces from './lib/GifFaces';
//importing this to setup the service contract
import ServiceContract from './lib/ServiceContract';
//Meme model crud
import MemeGenerator from './lib/MemeGenerator';
//Consumer model crud
import Consumer from './lib/Consumer';

//gif faces setup
const models = path.resolve(__dirname, '../api/models');
GifFaces.loadModels(models);
//express setup
const app = express();
//service contract setup
const service = ServiceContract.load(
  process.env.ADMIN_KEY as string, 
  serviceConfig
);

//declare some routes

/**
 * Example: /register
 * ?image=https://www.wearecashcows.com/images/collection/3283_0.png
 * &image=https://www.wearecashcows.com/images/collection/411_0.png
 * &wallet=0xbF77342243B2f6dfb7a0b37793b0ffdEeF669bb8
 */
app.get('/register', async (req, res) => {
  //if no wallet address
  if (!req.query?.wallet) {
    return res.json({ error: true, message: 'Wallet address missing' });
  //if no images
  } else if (!req.query?.image) {
    return res.json({ error: true, message: 'Images missing' });
  }

  const images = Array.isArray(req.query.image) 
    ? req.query.image as string[]
    : [ req.query.image ] as string[];

  const walletAddress = String(req.query.wallet);

  Consumer.register(walletAddress, images)
    .then(results => res.json({ error: false, results }))
    .catch(error => res.json({ error: true, message: error.message }));
});

/**
 * Example: /search?q=pump&limit=10
 */
app.get('/search', (req, res) => {
  if (!req.query?.q) return res.json({ 
    error: true, 
    message: 'Query missing' 
  });

  MemeGenerator.search(req.query)
    .then(results => res.json({ error: false, results }))
    .catch(error => res.json({ error: true, message: error.message }));
});

/**
 * Example: /detect
 * ?url=https://media.tenor.com/XxOtj-aoQeMAAAAC/bodybuilder-bodybuilding.gif
 */
app.get('/detect', (req, res) => {
  //if no URL was provided
  if (!req.query?.url) {
    //return error response
    return res.json({ error: true, message: 'URL missing' });
  //still loading?
  } else if (!GifFaces.modelsAreLoaded(models)) {
    //return error response
    return res.json({ error: true, message: 'AI still loading' });
  }

  MemeGenerator.detect(req.query.url as string)
    .then(results => res.json({ error: false, results }))
    .catch(error => res.json({ error: true, message: error.message })); 
});

/**
 * Example: /generate
 * ?key=0xbF77342243B2f6dfb7a0b37793b0ffdEeF669bb8
 * ?url=https://media.tenor.com/XxOtj-aoQeMAAAAC/bodybuilder-bodybuilding.gif
 */
app.get('/generate', async (req, res) => {
  //if no wallet address was provided
  if (typeof req.query?.key !== 'string') {
    //return error response
    return res.json({ error: true, message: 'API key missing' });
  //if no url was provided
  } else if (typeof req.query?.url !== 'string') {
    //return error response
    return res.json({ error: true, message: 'URL missing' });
  }

  const walletAddress = req.query.key as string;

  MemeGenerator.generate(walletAddress, req.query.url, service)
    .then(results => res.json({ error: false, results }))
    .catch(error => res.json({ error: true, message: error.message })); 
});

export default app;