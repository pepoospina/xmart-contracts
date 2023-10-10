import { ethers } from 'hardhat'
import { BigNumberish, Signer, Wallet, utils } from 'ethers'
import { createAccountOwner, deployEntryPoint } from '../test/testutils'
import {
  EntryPoint,
  XPaymaster,
  EntryPoint__factory,
  TestProtocol,
  TestProtocol__factory,
  TestToken,
  TestToken__factory,
  XAccountFactory,
  XAccountFactory__factory,
  XAccount__factory,
  XPaymaster__factory,
} from '../typechain'
import { expect } from 'chai'
import { fillAndSign, fillUserOp, signUserOp } from '../test/UserOp'
import { getXAccountInitCode } from './testutils'
import {
  arrayify,
  defaultAbiCoder,
  hexConcat,
  parseEther,
} from 'ethers/lib/utils'
import { UserOperation } from '../test/UserOperation'

describe('XMart Account', () => {
  let entryPoint: EntryPoint
  let paymaster: XPaymaster
  let user: Wallet
  let deployer: Signer
  let bundler: Signer
  let bundlerAddress: string
  let paymasterOwner: Signer
  let paymasterSigner: Signer
  let paymasterSignerAddress: string

  let token: TestToken
  let protocol: TestProtocol
  let decimals: BigNumberish
  let xAccountFactory: XAccountFactory
  let xAccountAddressPre: string
  let salt: BigNumberish

  before(async () => {
    const signers = await ethers.getSigners()
    deployer = signers[0]
    bundler = signers[1]
    paymasterOwner = signers[2]
    paymasterSigner = signers[3]

    bundlerAddress = await bundler.getAddress()
    paymasterSignerAddress = await paymasterSigner.getAddress()
    user = createAccountOwner()

    entryPoint = await deployEntryPoint(deployer)
    paymaster = await new XPaymaster__factory(paymasterOwner).deploy(
      entryPoint.address,
      paymasterSignerAddress
    )

    token = await new TestToken__factory(deployer).deploy()
    protocol = await new TestProtocol__factory(deployer).deploy()

    decimals = await token.decimals()
    xAccountFactory = await new XAccountFactory__factory(deployer).deploy(
      entryPoint.address
    )

    salt = utils.keccak256(utils.toUtf8Bytes('xmart-01'))
    xAccountAddressPre = await xAccountFactory.getAddress(user.address, salt)

    console.log(`Paymaster: ${paymaster.address}`)
    console.log(`entryPoint: ${entryPoint.address}`)
    console.log(`token: ${token.address}`)
    console.log(`xAccountAddress: ${xAccountAddressPre}`)
  })

  it('should be created, approve and send tokens in one transaction', async () => {
    const userFunds = 100
    const userSpends = 30

    /** send tokens to undeployed account */
    await(
      await token.mint(
        xAccountAddressPre,
        utils.parseUnits(userFunds.toString(), decimals)
      )
    ).wait()

    const accountTokenBalance = await token.balanceOf(xAccountAddressPre)
    expect(accountTokenBalance.toString()).to.eq(
      utils.parseUnits(userFunds.toString(), decimals)
    )

    /**
     * - create UserOperation with both calls (approve and claim)
     * - the operation will include the initCode of the wallet
     */
    const approveCalldata = token.interface.encodeFunctionData('approve', [
      protocol.address,
      utils.parseUnits('30', decimals),
    ])
    console.log(`approveCalldata: ${approveCalldata.toString()}`)

    const claimCalldata = protocol.interface.encodeFunctionData('deposit', [
      token.address,
      xAccountAddressPre,
      utils.parseUnits(userSpends.toString(), decimals),
    ])
    console.log(`claimCalldata: ${claimCalldata.toString()}`)

    const userOpRaw = await fillUserOp(
      {
        initCode: getXAccountInitCode(user.address, xAccountFactory, salt),
        nonce: 0,
        callData: XAccount__factory.createInterface().encodeFunctionData(
          'executeBatch',
          [
            [token.address, protocol.address],
            [],
            [approveCalldata, claimCalldata],
          ]
        ),
        callGasLimit: 150000,
      },
      entryPoint
    )

    /** deposit funds in the entrypoint, to the name of the paymaster */
    const paymasterEntryPoint = EntryPoint__factory.connect(
      entryPoint.address,
      paymasterOwner
    )
    await paymasterEntryPoint.depositTo(paymaster.address, {
      value: parseEther('1'),
    })

    const paymasterEntryPointBalance0 = await paymasterEntryPoint.balanceOf(
      paymaster.address
    )
    expect(paymasterEntryPointBalance0).to.eq(parseEther('1'))

    /** Get the paymaster signature to pay for userop */
    const hash = await paymaster.getHash(userOpRaw, 0, 0)
    const paymasterSignature = await paymasterSigner.signMessage(arrayify(hash))

    const userOpSigned = await signUserOp(
      {
        ...userOpRaw,
        paymasterAndData: hexConcat([
          paymaster.address,
          defaultAbiCoder.encode(['uint48', 'uint48'], [0, 0]),
          paymasterSignature,
        ]),
      },
      user,
      entryPoint
    )

    /** run user operation it through the entry point contract */
    const bundlerEntryPoint = EntryPoint__factory.connect(
      entryPoint.address,
      bundler
    )
    const tx = await bundlerEntryPoint.handleOps([userOpSigned], bundlerAddress)

    const res = await tx.wait()

    if (res.events === undefined) throw new Error('Events undefined')
    const accountDeployedEvent = res.events.find(
      (e) => e.event && e.event === 'AccountDeployed'
    )

    if (accountDeployedEvent === undefined)
      throw new Error('accountDeployedEvent undefined')
    const xAccountAddress = accountDeployedEvent.args?.sender

    expect(xAccountAddress).to.eq(xAccountAddressPre)

    const userOperationEvent = res.events.find(
      (e) => e.event && e.event === 'UserOperationEvent'
    )

    if (userOperationEvent === undefined)
      throw new Error('userOperationEvent undefined')

    expect(userOperationEvent.args?.success).to.be.true

    /** expect tokens to be now in the protocol balance */
    const accountTokenBalancePost = await token.balanceOf(xAccountAddress)
    const protocolTokenBalancePost = await token.balanceOf(protocol.address)
    const xAccountBalance = await protocol.balanceOf(xAccountAddress)

    expect(accountTokenBalancePost).to.eq(
      utils.parseUnits((userFunds - userSpends).toString(), decimals),
      'account token balance not as expected after depositing on protocol'
    )
    expect(protocolTokenBalancePost).to.eq(
      utils.parseUnits(userSpends.toString(), decimals),
      'protocol token balance not as expected after depositing on protocol'
    )
    expect(xAccountBalance).to.eq(
      utils.parseUnits(userSpends.toString(), decimals),
      'account balance on the protocol not as expected'
    )
  })
})
