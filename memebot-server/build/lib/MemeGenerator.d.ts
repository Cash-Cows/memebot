import { SearchResponse, ObjectAny, Direction } from '../utils/types';
import { Source, Consumer, Meme } from '../utils/prisma';
import ServiceContract from './ServiceContract';
export default class MemeGenerator {
    static detect(source: string | Source): Promise<Source>;
    static get(id: number | string): Promise<Meme | null>;
    static getOrThrow(id: number | string): Promise<Meme>;
    static generate(consumer: string | Consumer, source: string | Source, service: ServiceContract): Promise<Meme>;
    static generateOne(consumer: string | Consumer, query: string, service: ServiceContract, skip?: number, range?: number): Promise<Meme | null>;
    static search(query: ObjectAny, wait?: boolean): Promise<import(".prisma/client").Search | {
        request: string;
        response: SearchResponse;
    }>;
    static vote(meme: number | string | Meme, direction: Direction): Promise<Meme>;
    private static _canConsume;
    private static _chooseImage;
    private static _drawFace;
    private static _drawFrame;
    private static _fetchJSON;
    private static _generate;
    private static _makeImage;
    private static _upload;
}
