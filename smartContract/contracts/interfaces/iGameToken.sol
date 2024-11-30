// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

interface IGameToken {
    function mint(
        address _receiver, 
        uint256 _amount
    ) 
        external;
    
    function burn(
        uint256 _value
    ) 
        external;

    function transferFrom(
        address from, 
        address to, 
        uint256 value
    ) 
        external 
        returns (bool);
}