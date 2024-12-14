// SPDX-License-Identifier: MIT
pragma solidity =0.8.28;

interface IBridgeVault {
    function moveERC721Item(
        address _receiver,
        address _item, 
        uint256 _tokenId
    ) 
        external;
    
    function moveERC1155Item(
        address _receiver,
        address _item, 
        uint256 _tokenId
    ) 
        external;
}