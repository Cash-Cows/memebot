/// <reference types="qs" />
import axios from 'axios';
import express, { Response } from 'express';
import { InteractionType, InteractionResponseType } from 'discord-interactions';
import Web3 from 'web3';
import { ArrayOption, ObjectString, ObjectAny } from './types';
import commands from '../config/commands.json';
import services from '../config/services.json';
declare const applicationId: string;
declare const guildId: string;
declare const app: import("express-serve-static-core").Express;
declare const verify: (req: express.Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: express.Response<any, Record<string, any>>, next: express.NextFunction) => void;
declare const discord: import("axios").AxiosInstance;
declare const api: import("axios").AxiosInstance;
declare const toOptionsHash: (optionsArray: ArrayOption[]) => ObjectString;
declare const tryTo: (callback: Function) => Promise<any>;
declare const reply: (res: Response, content: string, ephemeral?: boolean) => express.Response<any, Record<string, any>>;
declare const message: (content: string, ephemeral?: boolean) => {
    type: InteractionResponseType;
    data: {
        content: string;
        ephemeral: boolean;
    };
};
export { api, app, axios, discord, applicationId, guildId, commands, services, verify, reply, message, tryTo, toOptionsHash, Web3, ObjectAny, ArrayOption, ObjectString, InteractionType, InteractionResponseType, };
