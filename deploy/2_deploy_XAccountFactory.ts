import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { getDeployer } from './utils/utils'

const deploySimpleAccountFactory: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployer, network } = await getDeployer(hre, 1)

  // only deploy on local test network.
  if (network.chainId !== 31337 && network.chainId !== 1337) {
    return
  }

  const entrypoint = await hre.deployments.get('EntryPoint')

  const ret = await hre.deployments.deploy('XAccountFactory', {
    from: deployer.address,
    args: [entrypoint.address],
    gasLimit: 6e6,
    log: true,
    deterministicDeployment: true,
  })

  console.log('== SimpleAccountFactory addr ==', ret.address)
}

export default deploySimpleAccountFactory
