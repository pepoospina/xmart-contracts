import { Signer } from "ethers"

// Deploys an implementation and a proxy pointing to this implementation
export async function createXAccount (
  ethersSigner: Signer,
  accountOwner: string,
  entryPoint: string,
  _factory?: XAccountFactory
):
  Promise<{
    proxy: SimpleAccount
    accountFactory: SimpleAccountFactory
    implementation: string
  }> {
  const accountFactory = _factory ?? await new SimpleAccountFactory__factory(ethersSigner).deploy(entryPoint)
  const implementation = await accountFactory.accountImplementation()
  await accountFactory.createAccount(accountOwner, 0)
  const accountAddress = await accountFactory.getAddress(accountOwner, 0)
  const proxy = SimpleAccount__factory.connect(accountAddress, ethersSigner)
  return {
    implementation,
    accountFactory,
    proxy
  }
}