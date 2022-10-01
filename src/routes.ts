import path from 'path';
import express from 'express';

import GifFaces from './models/GifFaces';
import MemeGenerator from './models/MemeGenerator';

import serviceConfig from '../service.json';
import ServiceContract from './models/ServiceContract';
import Consumer from './models/Consumer';

//load models
const models = path.resolve(__dirname, '../models');
GifFaces.loadModels(models);

const app = express();

const service = ServiceContract.load(
  process.env.TOKEN_ADMIN_KEY as string, 
  serviceConfig
);

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