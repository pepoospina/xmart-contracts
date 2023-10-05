import "../erc4337/samples/SimpleAccountFactory.sol";

contract XAccountFactory is SimpleAccountFactory {
  constructor(IEntryPoint _entryPoint) SimpleAccountFactory(_entryPoint) {
  }
}