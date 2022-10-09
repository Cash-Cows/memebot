/// <reference types="qs" />
import axios from 'axios';
import express from 'express';
import { InteractionType, InteractionResponseType } from 'discord-interactions';
import commands from './commands.json';
declare const applicationId: string;
declare const guildId: string;
declare const app: import("express-serve-static-core").Express;
declare const verify: (req: express.Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: express.Response<any, Record<string, any>>, next: express.NextFunction) => void;
declare const discord: import("axios").AxiosInstance;
export { app, axios, discord, applicationId, guildId, commands, verify, InteractionType, InteractionResponseType, };
