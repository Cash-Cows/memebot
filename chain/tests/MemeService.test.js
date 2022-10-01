const { expect, deploy, bindContract } = require('./utils');

describe('MemeService Tests', function () {
  before(async function() {
    const signers = await ethers.getSigners()

    const milk = await deploy('MockMilk')
    await bindContract('withMilk', 'MockMilk', milk, signers)

    const market = await deploy('MemeService', milk.address)
    await bindContract('withMeme', 'MemeService', market, signers)

    const [ admin, holder ] = signers

    //mint milk for holder
    this.balance = '1200000000000000000000'
    await admin.withMilk.mint(holder.address, this.balance)

    this.signers = { admin, holder }
  })

  it('Should load', async function () {
    const { admin, holder } = this.signers

    expect(await admin.withMilk.balanceOf(holder.address)).to.equal(this.balance)

    await holder.withMeme.load(holder.address, this.balance)
    
    expect(await admin.withMilk.balanceOf(holder.address)).to.equal(0)
    expect(await admin.withMeme.balanceOf(holder.address)).to.equal(this.balance)
  })
})