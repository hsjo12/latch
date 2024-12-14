// SPDX-License-Identifier: MIT
pragma solidity =0.8.28;

import {IRaidPrize} from "../interfaces/IRaidPrize.sol";

interface IPvpAndRaidVault is IRaidPrize {
    function moveToken(address _receiver, uint256 _amount) external;
    function moveToken(
        address _receiver, 
        PrizeInfo memory _prizeInfo, 
        uint64 _participants
    ) 
        external;
    function moveLeftOverToken(
        address _receiver,
        PrizeInfo memory _prizeInfo,
        uint256 _maxParticipants,
        uint256 _totalParticipants
    )  
        external;
}