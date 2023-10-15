import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { providers } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export const getDeployer = async (
  hre: HardhatRuntimeEnvironment,
  ix: Number = 0
): Promise<{
  deployer: SignerWithAddress
  provider: providers.Provider
  network: providers.Network
}> => {
  const signers = await hre.ethers.getSigners()

  const deployer = signers[0]
  if (deployer.provider === undefined) throw new Error('Undefined')

  const network = await deployer.provider.getNetwork()

  return {
    deployer,
    provider: deployer.provider,
    network,
  }
}

function deployFunc() {}

module.exports.default = deployFunc
