//used to interact with the service contract on the blockchain
import { ethers } from 'ethers';
//centralized type defs
import { ObjectAny } from '../utils/types';
//expressive error reporting pattern
import Exception from './Exception';

export const BigNumber = ethers.BigNumber;
export type BigNumber = ethers.BigNumber;

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

  //contract address
  private _address: string;
  //contract abi
  private _abi: ObjectAny[];
  //contract bytecode
  private _bytecode: string;
  //contract extra config
  private _config: ObjectAny;

  /* Constructor
  --------------------------------------------------------------------*/
  
  constructor(
    address: string, 
    abi: ObjectAny[], 
    bytecode: string, 
    config: ObjectAny
  ) {
    super();
    this._address = address;
    this._abi = abi;
    this._bytecode = bytecode;
    this._config = config;
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
   * Returns the service rate
   */
  get config(): ObjectAny {
    return this._config;
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
    return ethers.BigNumber.from(this._config.rate);
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
  public static load(wallet: string|ethers.Wallet, config: ObjectAny) {
    const { rpc, address, abi, bytecode } = config;
    //determine the extra config
    const extras = Object.assign({}, config);
    delete extras.rpc;
    delete extras.address;
    delete extras.abi;
    delete extras.bytecode;
    
    const serviceContract = new ServiceContract(
      address, 
      abi, 
      bytecode, 
      extras
    );
    serviceContract.provider = rpc;
    if (wallet) {
      serviceContract.admin = wallet;
    }
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