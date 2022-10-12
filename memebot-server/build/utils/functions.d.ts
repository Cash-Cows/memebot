import { Response } from 'express';
import { Request as InceptRequest, Response as InceptResponse, EventEmitter } from '@inceptjs/framework';
import { ObjectAny } from './types';
import { InteractionResponseType } from 'discord-interactions';
import { ArrayOption, ObjectString } from './types';
export declare const toOptionsHash: (optionsArray: ArrayOption[]) => ObjectString;
export declare const remitFactory: (emitter: EventEmitter) => (event: string, request: InceptRequest | ObjectAny, response?: InceptResponse | null) => Promise<any>;
export declare const tryTo: (callback: Function) => Promise<any>;
export declare const reply: (res: Response, content: string, ephemeral?: boolean) => Response<any, Record<string, any>>;
export declare const message: (content: string, ephemeral?: boolean) => {
    type: InteractionResponseType;
    data: {
        content: string;
        ephemeral: boolean;
    };
};
