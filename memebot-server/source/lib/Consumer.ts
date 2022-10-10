//centralized type defs
import { ObjectAny } from '../utils/types';
//consumer table ORM (mysql)
import { prisma } from '../utils/prisma';
//used to get balances
import ServiceContract, { BigNumber } from './ServiceContract';

export default class Consumer {
  /* Public Static Methods
  --------------------------------------------------------------------*/

  /**
   * Consumes a service
   */
  public static async consume(walletAddress: string, amount: string) {
    return await prisma.consumer.update({
      where: { walletAddress },
      data: { consumed: amount }
    });
  }

  /**
   * Returns consumer info
   */
   public static async get(id: number|string, key: string|null = null) {
    if (!key) {
      if (typeof id === 'string') {
        key = 'walletAddress';
      } else {
        key = 'id';
      }  
    }

    const where: ObjectAny = {};
    where[key] = id;
    return await prisma.consumer.findUnique({ where });
  }

  /**
   * Returns consumer info
   */
  public static async getOrThrow(
    id: number|string, 
    key: string|null = null
  ) {
    if (!key) {
      if (typeof id === 'string') {
        key = 'walletAddress';
      } else {
        key = 'id';
      }  
    }

    const where: ObjectAny = {};
    where[key] = id;
    return await prisma.consumer.findUniqueOrThrow({ where });
  }

  /**
   * Returns the consumer and balances
   */
  public static async getWithBalance(
    id: number|string, 
    key: string,
    service: ServiceContract
  ) {
    const consumer = await this.getOrThrow(id, key)
    const balance = await service.balanceOf(consumer.walletAddress);
    const consumed = BigNumber.from(consumer.consumed);
    return {
      ...consumer, 
      loadedBalance: balance.toString(), 
      availableBalance: balance.sub(consumed).toString() ,
      serviceRate: service.rate.toString()
    };
  }

  /**
   * Inserts/Updates a consumer. We need them registered to know what 
   * images to use when they generate
   */
  public static async register(
    walletAddress: string, 
    discordId: string, 
    images: string[]
  ) {
    return await prisma.consumer.upsert({
      where: { walletAddress },
      update: { images },
      create: { walletAddress, images, discordId }
    })
  }
}