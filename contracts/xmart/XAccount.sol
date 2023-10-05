import "../erc4337/samples/SimpleAccount.sol";

contract XAccount is SimpleAccount {
  constructor(IEntryPoint _entryPoint) SimpleAccount(_entryPoint) {
  }
}  