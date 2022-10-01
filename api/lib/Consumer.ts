//consumer table ORM (mysql)
import { prisma } from '../utils/prisma';
//expressive error reporting pattern
import Exception from './Exception';
//the blockchain service contract
import ServiceContract, { BigNumber } from './ServiceContract';

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

  /**
   * Returns all the relative service balances
   */
  public static async getBalances(
    walletAddress: string, 
    service: ServiceContract
  ) {
    //get the consumer info
    const consumer = await prisma.consumer.findUniqueOrThrow(
      { where: { walletAddress } }
    );
    //make consumed a big number
    const consumedBalance = BigNumber.from(consumer.consumed);
    //get the owner balance from the blockchain
    const totalBalance = await service.balanceOf(walletAddress);
    return { totalBalance, consumedBalance, serviceRate: service.rate };
  }

  /**
   * Returns true if the wallet can consume the given service
   */
  public static async canConsume(
    walletAddress: string, 
    service: ServiceContract
  ) {
    const { 
      totalBalance, 
      consumedBalance, 
      serviceRate 
    } = await this.getBalances(walletAddress, service);
    //check if has balance
    return parseInt(
      totalBalance
        .sub(consumedBalance)
        .sub(serviceRate)
        .toString()
    ) > 0;
  }
  
  /**
   * Consumes tokens of the given wallet address
   */
  public static async consume(walletAddress: string, service: ServiceContract) {
    const { 
      totalBalance, 
      consumedBalance, 
      serviceRate 
    } = await this.getBalances(walletAddress, service);
    //check if has balance
    const hasBalance = parseInt(
      totalBalance
        .sub(consumedBalance)
        .sub(serviceRate)
        .toString()
    ) > 0;
    if (!hasBalance) {
      throw Exception.for('Not enough balance');
    }

    //add amount to consumed
    consumedBalance.add(service.rate);

    //now consume it
    await prisma.consumer.update({
      where: { walletAddress },
      data: { consumed: consumedBalance.toString() }
    });

    //return the new balance
    return totalBalance.sub(consumedBalance).toString();
  }
}