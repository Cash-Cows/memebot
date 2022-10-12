"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractAdmin = exports.BigNumber = void 0;
const ethers_1 = require("ethers");
const framework_1 = require("@inceptjs/framework");
exports.BigNumber = ethers_1.ethers.BigNumber;
class ContractAdmin {
    static get admin() {
        return this._admin;
    }
    static get provider() {
        return this._provider;
    }
    static set admin(wallet) {
        if (wallet instanceof ethers_1.ethers.Wallet) {
            this._admin = wallet;
            return;
        }
        else if (!this._provider) {
            throw framework_1.Exception.for('Provider is not set');
        }
        this._admin = new ethers_1.ethers.Wallet(wallet, this._provider);
    }
    static set provider(provider) {
        if (provider instanceof ethers_1.ethers.providers.JsonRpcProvider) {
            this._provider = provider;
            return;
        }
        this._provider = new ethers_1.ethers.providers.JsonRpcProvider(provider);
    }
    static makeContract(address, abi, bytecode) {
        const factory = new ethers_1.ethers.ContractFactory(abi, bytecode, this.admin);
        return factory.attach(address);
    }
}
exports.ContractAdmin = ContractAdmin;
class ServiceContract extends ContractAdmin {
    constructor(address, abi, bytecode, config) {
        super();
        this._address = address;
        this._abi = abi;
        this._bytecode = bytecode;
        this._config = config;
    }
    get abi() {
        return this._abi;
    }
    get address() {
        return this._address;
    }
    get admin() {
        return ServiceContract.admin;
    }
    get bytecode() {
        return this._bytecode;
    }
    get config() {
        return this._config;
    }
    get provider() {
        return ServiceContract.provider;
    }
    get rate() {
        return ethers_1.ethers.BigNumber.from(this._config.rate);
    }
    set admin(wallet) {
        ServiceContract.admin = wallet;
    }
    set provider(provider) {
        ServiceContract.provider = provider;
    }
    static load(wallet, config) {
        const { rpc, address, abi, bytecode } = config;
        const extras = Object.assign({}, config);
        delete extras.rpc;
        delete extras.address;
        delete extras.abi;
        delete extras.bytecode;
        const serviceContract = new ServiceContract(address, abi, bytecode, extras);
        serviceContract.provider = rpc;
        if (wallet) {
            serviceContract.admin = wallet;
        }
        return serviceContract;
    }
    balanceOf(owner) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield ServiceContract
                .makeContract(this._address, this._abi, this._bytecode)
                .balanceOf(owner);
        });
    }
}
exports.default = ServiceContract;
