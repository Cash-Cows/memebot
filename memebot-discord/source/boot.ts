import axios from 'axios';
import express from 'express';
import { 
  InteractionType, 
  verifyKeyMiddleware,
  InteractionResponseType
} from 'discord-interactions';
import dotenv from 'dotenv';
import commands from './commands.json';

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
  baseURL: 'https://discord.com/api/',
  timeout: 3000,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Authorization',
    'Authorization': `Bot ${tokenId}`
  }
})

export {
  app,
  axios,
  discord,
  applicationId,
  guildId,
  commands,
  verify,
  InteractionType,
  InteractionResponseType,
};