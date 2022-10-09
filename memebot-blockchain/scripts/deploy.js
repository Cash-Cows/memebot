//to run this on testnet:
//$ npx hardhat run chain/scripts/deploy.js

const hardhat = require('hardhat')

function getRole(name) {
  if (!name || name === 'DEFAULT_ADMIN_ROLE') {
    return '0x0000000000000000000000000000000000000000000000000000000000000000';
  }

  return '0x' + Buffer.from(
    hardhat.ethers.utils.solidityKeccak256(['string'], [name]).slice(2)
    , 'hex'
  ).toString('hex');
}

async function deploy(name, ...params) {
  //deploy the contract
  const ContractFactory = await hardhat.ethers.getContractFactory(name);
  const contract = await ContractFactory.deploy(...params);
  await contract.deployed();

  return contract;
}

async function main() {
  console.log('Deploying MemeService ...')
  const network = hardhat.config.networks[hardhat.config.defaultNetwork]
  const milk = { address: network.contracts.milk }
  const meme = await deploy('MemeService', milk.address)

  console.log('')
  console.log('-----------------------------------')
  console.log('MemeService deployed to:', meme.address)
  console.log(
    'npx hardhat verify --show-stack-traces --network',
    hardhat.config.defaultNetwork,
    meme.address, 
    `"${milk.address}"`
  )
  console.log('')
  console.log('-----------------------------------')
  console.log('Next Steps:')
  console.log('In CashCowsMilk contract, grant BURNER_ROLE to market contract')
  console.log(` - ${network.scanner}/address/${milk.address}#writeContract`)
  console.log(` - grantRole( ${getRole('BURNER_ROLE')}, ${meme.address} )`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().then(() => process.exit(0)).catch(error => {
  console.error(error)
  process.exit(1)
});