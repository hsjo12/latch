// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

interface IPvpAndRaidVault {
    function MoveToken(address _receiver, uint256 _amount) external;
}