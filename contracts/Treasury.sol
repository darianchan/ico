// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract Treasury {
    uint public balance;

    receive() external payable {
        balance += msg.value;
    }
}