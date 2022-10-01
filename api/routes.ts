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
  process.env.TOKEN_ADMIN_KEY as string, 
  serviceConfig
);

//declare some routes

app.get('/register', async (req, res) => {
  //if no wallet address
  if (!req.query?.walletAddress) {
    return res.json({ 
      error: true, 
      message: 'Wallet address missing' 
    });
  //if no images
  } else if (!req.query?.images 
    || !Array.isArray(req.query.images)
    || !req.query.images.length
  ) {
    return res.json({ 
      error: true, 
      message: 'Images missing' 
    });
  }

  const images = req.query.images as string[];
  const walletAddress = String(req.query.walletAddress);

  Consumer.register(walletAddress, images)
    .then(results => res.json({ error: false, results }))
    .catch(error => res.json({ error: true, message: error.message }));
})

app.get('/search', (req, res) => {
  if (!req.query?.q) return res.json({ 
    error: true, 
    message: 'Query missing' 
  });

  MemeGenerator.search(req.query)
    .then(results => res.json({ error: false, results }))
    .catch(error => res.json({ error: true, message: error.message }));
})

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
})

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

  //check if they have balance
  if (!(await Consumer.canConsume(walletAddress, service))) {
    //return error response
    return res.json({ error: true, message: 'Not enough balance' });
  }

  MemeGenerator.generate(walletAddress, req.query.url)
    .then(results => {
      Consumer.consume(walletAddress, service);
      return results;
    })
    .then(results => res.json({ error: false, results }))
    .catch(error => res.json({ error: true, message: error.message })); 
})

export default app;