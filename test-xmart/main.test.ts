import { ethers } from 'hardhat'
import { BigNumberish, Signer, Wallet, utils } from 'ethers'
import { createAccountOwner, deployEntryPoint } from '../test/testutils'
import { EntryPoint, TestToken, TestToken__factory, XAccountFactory, XAccountFactory__factory } from '../typechain'

describe('XMart Account', () => {
  let entryPoint: EntryPoint
  let owner: Wallet
  let deployer: Signer

  let token: TestToken
  let decimals: BigNumberish
  let xAccountFactory: XAccountFactory

  before(async () => {
    deployer = (await ethers.getSigners())[0]
    owner = createAccountOwner()
    entryPoint = await deployEntryPoint()
    token = await new TestToken__factory(deployer).deploy()
    decimals = await token.decimals()
    xAccountFactory = await new XAccountFactory__factory(deployer).deploy(entryPoint.address)

    const xAccountAddressPre = await xAccountFactory.getAddress(owner.address, utils.keccak256(utils.toUtf8Bytes('xmart-01')))
    
    /** send tokens to undeployed account */
    await token.mint(xAccountAddressPre, ethers.utils.parseUnits('100', decimals))
  })

  it('should be created, approve and send tokens in one transaction', () => {

  })
})
