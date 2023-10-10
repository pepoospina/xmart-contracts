// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TestProtocol {
    mapping(address => uint256) balances;

    event Deposit(address from, uint256 amount);

    function balanceOf(address from) public view returns(uint256 balance) {
        return balances[from];
    }

    function deposit(IERC20 token, address from, uint256 amount) external {
        require(msg.sender == from, 'only the holder of the tokens can trigger claim');
        require(token.transferFrom(from, address(this), amount), 'error transferring token');
        balances[from] = balances[from] + amount;
        emit Deposit(from, amount);
    }
}
