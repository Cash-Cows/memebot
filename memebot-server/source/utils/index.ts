//used to resolve the models path
import path from 'path';
//used to transform a buffer into a stream (for uploading)
import { Readable } from 'stream';
//used to format the request (for uploading to ipfs)
import FormData from 'form-data';
//for remote fetching
import axios from 'axios';
//http routing
import express, { 
  Request as ExpressRequest, 
  Response as ExpressResponse,
} from 'express';
import { 
  Request as InceptRequest,
  Response as InceptResponse,
  EventEmitter, 
  Exception 
} from '@inceptjs/framework';
import { 
  InteractionType, 
  verifyKeyMiddleware
} from 'discord-interactions';
import dotenv from 'dotenv';
import Web3 from 'web3';

//models
import FaceSmash from './lib/FaceSmash';
import ServiceContract, { BigNumber } from './lib/ServiceContract';

//utils
import { loadTF } from './canvas';

import { 
  toOptionsHash, 
  tryTo, 
  reply, 
  remitFactory,
  message 
} from './functions';

import { 
  prisma, 
  Prisma, 
  SourceType, 
  ConsumerType, 
  SearchType, 
  MemeType 
} from './prisma';

import { 
  Box, 
  Frame, 
  ArrayOption, 
  ObjectString, 
  ObjectAny,
  Direction,
  IPFSResponse,
  TenorResponse,
  TenorSearchResult,
  TenorSearchResponse
} from './types';

//configs
import serviceConfig from '../config/service.json';
import commands from '../config/commands.json';
//import process.env variables from .env file
dotenv.config();

//environment variables
const { 
  DISCORD_APPLICATION_ID,
  DISCORD_TOKEN,
  DISCORD_PUBLIC_KEY,
  DISCORD_GUILD_ID,
  INFURA_API_KEY,
  INFURA_API_SECRET,
  TENOR_KEY,
  ADMIN_KEY
} = process.env;

const env = {
  discordApplicationId: DISCORD_APPLICATION_ID as string,
  discordTokenId: DISCORD_TOKEN as string,
  discordPublicKey: DISCORD_PUBLIC_KEY as string,
  discordGuildId: DISCORD_GUILD_ID as string,
  infuraKey: INFURA_API_KEY as string,
  infuraSecret: INFURA_API_SECRET as string,
  tenorKey: TENOR_KEY as string,
  tenorClient: 'tenorcept',
  adminKey: ADMIN_KEY as string
}

//express setup
const app = express();
//events setup
const emitter = new EventEmitter();
//gif faces setup
const models = path.resolve(__dirname, '../../models');
loadTF().then(_ => FaceSmash.loadModels(models));
//service contract setup
const service = ServiceContract.load(env.adminKey, serviceConfig);

const discord = axios.create({
  baseURL: 'https://discord.com/api',
  timeout: 3600,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Authorization',
    'Authorization': `Bot ${env.discordTokenId}`
  }
});

const tenor = axios.create({ 
  baseURL: 'https://tenor.googleapis.com/v2' 
});

const infura = axios.create({ 
  baseURL: 'https://ipfs.infura.io:5001/api/v0' 
});

const verify = verifyKeyMiddleware(env.discordPublicKey);
const remit = remitFactory(emitter);

export {
  //variables
  env,
  models,
  commands,
  //instances
  app,
  prisma,
  emitter,
  service,
  //axios
  axios,
  tenor,
  infura,
  discord,
  //functions
  reply,
  remit,
  tryTo,
  verify,
  message,
  express,
  toOptionsHash,
  //classes
  Web3,
  Readable,
  FormData,
  Exception,
  FaceSmash,
  EventEmitter,
  InceptRequest, 
  InceptResponse,
  //generic types
  ObjectAny,
  ArrayOption,
  ObjectString,
  //canvas types
  Box, 
  Frame,
  //blockchain types
  BigNumber,
  IPFSResponse,
  //express types
  ExpressRequest, 
  ExpressResponse,
  //discord types
  InteractionType, 
  //tenor types
  TenorResponse,
  TenorSearchResult,
  TenorSearchResponse, 
  Direction,
  //prisma types
  Prisma, 
  MemeType, 
  SearchType, 
  SourceType, 
  ConsumerType
};