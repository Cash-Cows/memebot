import ServiceContract from './ServiceContract';
export default class Consumer {
    static consume(walletAddress: string, amount: string): Promise<import(".prisma/client").Consumer>;
    static get(id: number | string): Promise<import(".prisma/client").Consumer | null>;
    static getOrThrow(id: number | string): Promise<import(".prisma/client").Consumer>;
    static getWithBalance(id: number | string, service: ServiceContract): Promise<{
        loadedBalance: string;
        availableBalance: string;
        serviceRate: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        walletAddress: string;
        consumed: string;
        images: import(".prisma/client").Prisma.JsonValue;
    }>;
    static register(walletAddress: string, images: string[]): Promise<import(".prisma/client").Consumer>;
}
