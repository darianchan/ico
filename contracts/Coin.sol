// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// TODO: override the transfer function so there is a 2% tax on all future trades
contract SpaceCoin is ERC20 {

    constructor() ERC20("SpaceCoin", "Space") {
        _mint(msg.sender, 500000 * 10**18);
    }
}