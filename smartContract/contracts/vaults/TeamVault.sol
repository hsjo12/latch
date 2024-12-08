// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract TeamVault is AccessControl, IERC721Receiver {
    bytes32 constant MANAGER = 0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c;
    IERC721 immutable gasback;
    event Withdraw(address indexed user, uint256 amount);

    IERC20 public battingToken; 
    
    constructor(
        IERC721 _gasback, 
        IERC20 _battingToken, 
        address _manager
    ) {
        gasback = _gasback;
        battingToken = _battingToken;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER, _manager);
    }

    function withdraw(
        address _receiver
    ) 
        external 
        onlyRole(MANAGER)  
    {
        uint256 amount = battingToken.balanceOf(address(this));
        battingToken.transfer(_receiver, amount);     
        emit Withdraw(msg.sender, amount);
    }

    function setBattingToken(IERC20 _battingToken) external onlyRole(MANAGER)  {
        battingToken = _battingToken;
    }

    function withdrawGasbackNFT(
        address _receiver,
        uint256 _tokenId
    ) 
        external 
        onlyRole(MANAGER)  
    {
        gasback.safeTransferFrom(address(this), _receiver, _tokenId, "");
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
