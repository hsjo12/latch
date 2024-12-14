// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract Latch is  ERC20, ERC20Burnable, AccessControl {

    // keccak256("TOKEN_MINTER");
    bytes32 constant TOKEN_MINTER = 0x262c70cb68844873654dc54487b634cb00850c1e13c785cd0d96a2b89b829472;

    constructor() ERC20("LATCH","LAT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function mint(
        address _receiver, 
        uint256 _amount
    ) 
        external 
        onlyRole(TOKEN_MINTER) 
    {
        _mint(_receiver, _amount);
    }

}