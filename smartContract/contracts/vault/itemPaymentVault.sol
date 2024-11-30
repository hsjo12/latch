// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ItemPaymentVault is Ownable {

    event Withdraw(address indexed user, uint256 amount);

    IERC20 public battingToken; 
    
    constructor(IERC20 _battingToken,address _manager) Ownable(msg.sender) {
        teamTax = 1000; // 10%
        battingToken = _battingToken;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER, _manager);
    }

    function withdraw(
        address _receiver
    ) 
        external 
        onlyOwner 
    {

        uint256 amount = battingToken.balanceOf(address(this));
        battingToken.transfer(_receiver, amount);     
        emit Withdraw(msg.sender, amount); 
        
    }

    function setBattingToken(IERC20 _battingToken) onlyOwner {
        battingToken = _battingToken;
    }

}