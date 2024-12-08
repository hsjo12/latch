// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC1155 } from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import { IRaidPrize } from "../interfaces/IRaidPrize.sol";

contract RaidVault is AccessControl, ERC1155Holder, IRaidPrize {
    bytes32 constant MANAGER = 0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c;
    bytes32 constant DISTRIBUTOR = 0x85faced7bde13e1a7dad704b895f006e704f207617d68166b31ba2d79624862d;
 
    event MoveToken(address indexed receiver, address prize, uint256 amount);
    event MoveLeftOverToken(address indexed receiver, address prize, uint256 amount);

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
        PrizeInfo memory _prizeInfo, 
        uint64 _participants
    ) 
        external 
        onlyRole(DISTRIBUTOR)  
    {
        if (_prizeInfo.prizeType == PrizeType.ERC20) {
            uint256 amount = _prizeInfo.quantity / _participants;
            IERC20(_prizeInfo.prize).transfer(_receiver, amount);
            emit MoveToken(_receiver, _prizeInfo.prize, amount);
        } else if (_prizeInfo.prizeType == PrizeType.ERC1155) {
            IERC1155(_prizeInfo.prize).safeTransferFrom(address(this), _receiver, _prizeInfo.id, 1, "");
            emit MoveToken(_receiver, _prizeInfo.prize, 1);
        } else {
            revert InvalidType();
        }

    }

    function moveLeftOverToken(
        address _receiver,
        PrizeInfo memory _prizeInfo,
        uint256 _maxParticipants,
        uint256 _totalParticipants
    ) 
        external 
        onlyRole(DISTRIBUTOR)  
    {
        if (_prizeInfo.prizeType == PrizeType.ERC20) {
            uint256 amount = _prizeInfo.quantity / _maxParticipants;
            amount = _prizeInfo.quantity - amount * _totalParticipants;
            IERC20(_prizeInfo.prize).transfer(_receiver, amount);
            emit MoveLeftOverToken(_receiver, _prizeInfo.prize, amount);
        } else if (_prizeInfo.prizeType == PrizeType.ERC1155) {
            uint256 amount = _prizeInfo.quantity - _totalParticipants;
            IERC1155(_prizeInfo.prize).safeTransferFrom(address(this), _receiver, _prizeInfo.id, amount, "");
            emit MoveLeftOverToken(_receiver, _prizeInfo.prize, amount);
        } else {
            revert InvalidType();
        }

    }

    function supportsInterface(
        bytes4 interfaceId
    ) 
        public 
        view 
        virtual 
        override(
            ERC1155Holder,
            AccessControl
        ) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }

}