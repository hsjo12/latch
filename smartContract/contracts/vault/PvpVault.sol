// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PvpVault is AccessControl {
    bytes32 constant MANAGER = 0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c;
    bytes32 constant DISTRIBUTOR = 0x85faced7bde13e1a7dad704b895f006e704f207617d68166b31ba2d79624862d;
 
    event MoveToken(address indexed receiver, uint256 amount);

    IERC20 public battingToken; 
    
    constructor(
        IERC20 _battingToken, 
        address _manager
    ) 
    {
        battingToken = _battingToken;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER, _manager);
    }

    function setBattingToken(IERC20 _battingToken) external onlyRole(MANAGER) {
        battingToken = _battingToken;
    }

    function moveToken(
        address _receiver, 
        uint256 _amount
    ) 
        external 
        onlyRole(DISTRIBUTOR)  
    {
        battingToken.transfer(_receiver, _amount);
        emit MoveToken(_receiver, _amount);
    }
}