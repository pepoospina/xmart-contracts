import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

import { Create2Factory } from '../src/Create2Factory'
import { getDeployer } from './utils/utils'

const deployEntryPoint: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployer, provider } = await getDeployer(hre, 0)

  await new Create2Factory(provider).deployFactory()

  const ret = await hre.deployments.deploy('EntryPoint', {
    from: deployer.address,
    args: [],
    gasLimit: 6e6,
    deterministicDeployment: true,
  })

  console.log('== entrypoint addr ==', ret.address)
}

export default deployEntryPoint
