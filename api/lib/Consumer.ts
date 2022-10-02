//consumer table ORM (mysql)
import { prisma } from '../utils/prisma';

export default class Consumer {
  /* Public Static Methods
  --------------------------------------------------------------------*/

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