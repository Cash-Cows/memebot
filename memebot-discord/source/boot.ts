import axios from 'axios';
import express, { Response } from 'express';
import { 
  InteractionType, 
  verifyKeyMiddleware,
  InteractionResponseType
} from 'discord-interactions';
import dotenv from 'dotenv';
import Web3 from 'web3';
import { ArrayOption, ObjectString, ObjectAny } from './types';
import commands from '../config/commands.json';
import services from '../config/services.json';

dotenv.config();

const { 
  APPLICATION_ID,
  TOKEN,
  PUBLIC_KEY,
  GUILD_ID
} = process.env;

const applicationId = APPLICATION_ID as string;
const tokenId = TOKEN as string;
const publicKey = PUBLIC_KEY as string;
const guildId = GUILD_ID as string;

const app = express()

const verify = verifyKeyMiddleware(publicKey);

const discord = axios.create({
  baseURL: 'https://discord.com/api',
  timeout: 3600,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Authorization',
    'Authorization': `Bot ${tokenId}`
  }
});

const api = axios.create({
  baseURL: 'https://meme-bot.onrender.com/api'
});

const toOptionsHash = function(optionsArray: ArrayOption[]) {
  const options: ObjectString = {};
  optionsArray.forEach(option => (options[option.name] = option.value));
  return options;
};

const tryTo = async function(callback: Function) {
  try {
    return await callback()
  } catch(e) {
    return null
  }
};

const reply = (res: Response, content: string, ephemeral = true) => {
  return res.send(message(content, ephemeral));
};

const message = (content: string, ephemeral = true) => {
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content, ephemeral }
  };
};

export {
  api,
  app,
  axios,
  discord,
  applicationId,
  guildId,
  commands,
  services,
  verify,
  reply,
  message,
  tryTo,
  toOptionsHash,
  Web3,
  ObjectAny,
  ArrayOption,
  ObjectString,
  InteractionType,
  InteractionResponseType,
};