import { Response } from 'express';
import { 
  Exception,
  Request as InceptRequest,
  Response as InceptResponse,
  EventEmitter 
} from '@inceptjs/framework';

import { ObjectAny } from './types';
import { 
  InteractionResponseType
} from 'discord-interactions';

import { 
  ArrayOption, 
  ObjectString
} from './types';

export const toOptionsHash = function(optionsArray: ArrayOption[]) {
  const options: ObjectString = {};
  optionsArray.forEach(option => (options[option.name] = option.value));
  return options;
};

export const remitFactory = function(emitter: EventEmitter) {
  return async function(
    event: string, 
    request: InceptRequest|ObjectAny, 
    response: InceptResponse|null = null
  ) {
    if (!(request instanceof InceptRequest)) {
      const params = request;
      request = new InceptRequest();
      request.params = params;
    }
  
    if (!(response instanceof InceptResponse)) {
      response = new InceptResponse();
    }
  
    await emitter.emit(event, request, response);

    const body = await response.json();
    
    if (body?.error) {
      throw Exception.for(body.message);
    }
  
    return body.results;
  };
};

export const tryTo = async function(callback: Function) {
  try {
    return await callback()
  } catch(e) {
    return null
  }
};

export const reply = (res: Response, content: string, ephemeral = true) => {
  return res.send(message(content, ephemeral));
};

export const message = (content: string, ephemeral = true) => {
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content, ephemeral }
  };
};