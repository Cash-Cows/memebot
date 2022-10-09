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
   public static async get(id: number|string) {
    const where: ObjectAny = {};
    if (typeof id === 'string') {
      where.walletAddress = id;
    } else {
      where.id = id
    }
    return await prisma.consumer.findUnique({ where });
  }

  /**
   * Returns consumer info
   */
  public static async getOrThrow(id: number|string) {
    const where: ObjectAny = {};
    if (typeof id === 'string') {
      where.walletAddress = id;
    } else {
      where.id = id
    }
    return await prisma.consumer.findUniqueOrThrow({ where });
  }

  /**
   * Returns the consumer and balances
   */
  public static async getWithBalance(
    id: number|string, 
    service: ServiceContract
  ) {
    const consumer = await this.getOrThrow(id)
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
  public static async register(walletAddress: string, images: string[]) {
    return await prisma.consumer.upsert({
      where: { walletAddress },
      update: { images },
      create: { walletAddress, images }
    })
  }
}