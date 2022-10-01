import { ethers } from 'ethers';

import { ObjectAny } from './types';
import Exception from './Exception';

export class ContractAdmin {
  /* Private Properties
  --------------------------------------------------------------------*/

  //the admin wallet that this class uses to call blockchain methods
  private static _admin: ethers.Wallet;
  //the blockchain network provider
  private static _provider: ethers.providers.JsonRpcProvider;

  /* Getter/Setter Methods
  --------------------------------------------------------------------*/

  /**
   * Returns the admin wallet
   */
  static get admin(): ethers.Wallet {
    return this._admin;
  }

  /**
   * Returns the network provider
   */
  static get provider(): ethers.providers.JsonRpcProvider {
    return this._provider;
  }

  /**
   * Sets the admin wallet. The wallet can be a private key string
   */
  static set admin(wallet: string|ethers.Wallet) {
    if (wallet instanceof ethers.Wallet) {
      this._admin = wallet
      return;
    } else if (!this._provider) {
      throw Exception.for('Provider is not set');
    }
    this._admin = new ethers.Wallet(wallet, this._provider);
  }

  /**
   * Sets the network provider. The provider can be the RPC url
   */
  static set provider(provider: string|ethers.providers.JsonRpcProvider) {
    if (provider instanceof ethers.providers.JsonRpcProvider) {
      this._provider = provider;
      return;
    } 

    this._provider = new ethers.providers.JsonRpcProvider(provider);
  }

  /* Public Methods
  --------------------------------------------------------------------*/

  /**
   * Returns a callable contract
   */
  public static makeContract(
    address: string, 
    abi: ObjectAny[], 
    bytecode: string
  ) {
    const factory = new ethers.ContractFactory(
      abi, 
      bytecode, 
      this.admin
    );
  
    return factory.attach(address);
  }
}

export default class ServiceContract extends ContractAdmin {
  /* Private Properties
  --------------------------------------------------------------------*/

  private _address: string;
  private _abi: ObjectAny[];
  private _bytecode: string;
  private _rate: ethers.BigNumber;

  /* Constructor
  --------------------------------------------------------------------*/
  
  constructor(
    address: string, 
    abi: ObjectAny[], 
    bytecode: string, 
    rate: string
  ) {
    super();
    this._address = address;
    this._abi = abi;
    this._bytecode = bytecode;
    this._rate = ethers.BigNumber.from(rate);
  }

  /* Getter Methods
  --------------------------------------------------------------------*/

  /**
   * Returns the contract abi
   */
  get abi(): ObjectAny[] {
    return this._abi;
  }

  /**
   * Returns the contract address
   */
  get address(): string {
    return this._address;
  }

  /**
   * Returns the admin wallet
   */
  get admin(): ethers.Wallet {
    return ServiceContract.admin;
  }

  /**
   * Returns the contract bytecode
   */
  get bytecode(): string {
    return this._bytecode;
  }

  /**
   * Returns the network provider
   */
  get provider(): ethers.providers.JsonRpcProvider {
    return ServiceContract.provider;
  }

  /**
   * Returns the service rate
   */
  get rate(): ethers.BigNumber {
    return this._rate;
  }

  /**
   * Sets the admin wallet. The wallet can be a private key string
   */
  set admin(wallet: string|ethers.Wallet) {
    ServiceContract.admin = wallet;
  }

  /**
   * Sets the network provider. The provider can be the RPC url
   */
  set provider(provider: string|ethers.providers.JsonRpcProvider) {
    ServiceContract.provider = provider;
  }

  /* Public Static Methods
  --------------------------------------------------------------------*/

  /**
   * Service contract factory loader
   */
  public static load(wallet:string|ethers.Wallet, config: ObjectAny) {
    const { rpc, address, abi, bytecode, rate } = config;
    const serviceContract = new ServiceContract(
      address, 
      abi, 
      bytecode, 
      rate
    );
    serviceContract.provider = rpc;
    serviceContract.admin = wallet;
    return serviceContract;
  }

  /* Public Methods
  --------------------------------------------------------------------*/

  /**
   * Returns the current token balance of the owner from the contract
   */
  public async balanceOf(owner: string): Promise<ethers.BigNumber> {
    return await ServiceContract
      .makeContract(this._address, this._abi, this._bytecode)
      .balanceOf(owner);
  }
}