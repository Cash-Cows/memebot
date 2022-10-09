import { ethers } from 'ethers';
import { ObjectAny } from '../utils/types';
export declare const BigNumber: typeof ethers.BigNumber;
export declare type BigNumber = ethers.BigNumber;
export declare class ContractAdmin {
    private static _admin;
    private static _provider;
    static get admin(): ethers.Wallet;
    static get provider(): ethers.providers.JsonRpcProvider;
    static set admin(wallet: string | ethers.Wallet);
    static set provider(provider: string | ethers.providers.JsonRpcProvider);
    static makeContract(address: string, abi: ObjectAny[], bytecode: string): ethers.Contract;
}
export default class ServiceContract extends ContractAdmin {
    private _address;
    private _abi;
    private _bytecode;
    private _config;
    constructor(address: string, abi: ObjectAny[], bytecode: string, config: ObjectAny);
    get abi(): ObjectAny[];
    get address(): string;
    get admin(): ethers.Wallet;
    get bytecode(): string;
    get config(): ObjectAny;
    get provider(): ethers.providers.JsonRpcProvider;
    get rate(): ethers.BigNumber;
    set admin(wallet: string | ethers.Wallet);
    set provider(provider: string | ethers.providers.JsonRpcProvider);
    static load(wallet: string | ethers.Wallet, config: ObjectAny): ServiceContract;
    balanceOf(owner: string): Promise<ethers.BigNumber>;
}
