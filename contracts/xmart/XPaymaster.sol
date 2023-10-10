// SPDX-License-Identifier: GPL-3.0

import '../erc4337/samples/VerifyingPaymaster.sol';

import "hardhat/console.sol";

contract XPaymaster is VerifyingPaymaster {
  constructor(IEntryPoint _entryPoint, address _verifyingSigner) VerifyingPaymaster(_entryPoint, _verifyingSigner) {}
  
  function _postOp(
      PostOpMode mode,
      bytes calldata context,
      uint256 actualGasCost
  ) internal virtual override {
    console.log('_postOp() mode: %d', uint(mode));
  }
}