// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

interface IGasback {
    function register(
        address _nftRecipient, 
        address _smartContract
    ) 
        external;
}