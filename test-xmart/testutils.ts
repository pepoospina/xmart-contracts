import { BigNumberish, BytesLike, Signer } from 'ethers'
import { XAccountFactory } from '../typechain'
import { hexConcat } from 'ethers/lib/utils'

// helper function to create the initCode to deploy the xaccount, using our account factory.
export function getXAccountInitCode(
  owner: string,
  factory: XAccountFactory,
  salt: BigNumberish = 0
): BytesLike {
  return hexConcat([
    factory.address,
    factory.interface.encodeFunctionData('createAccount', [owner, salt]),
  ])
}
