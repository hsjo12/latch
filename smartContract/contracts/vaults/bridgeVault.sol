// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { IERC1155 } from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import { ERC721Holder } from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import { ERC1155Holder } from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
contract BridgeVault is AccessControl, ERC721Holder, ERC1155Holder {

    bytes32 constant MANAGER = 0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c;
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function moveERC721Item(
        address _receiver,
        address _item, 
        uint256 _tokenId
    ) 
        external 
        onlyRole(MANAGER)  
    {
        IERC721(_item).safeTransferFrom(address(this), _receiver, _tokenId, "");
    }

    function moveERC1155Item(
        address _receiver,
        address _item, 
        uint256 _tokenId
    ) 
        external 
        onlyRole(MANAGER)  
    {
        IERC1155(_item).safeTransferFrom(address(this), _receiver, _tokenId, 1, "");
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