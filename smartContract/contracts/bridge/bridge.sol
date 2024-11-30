// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;
import { IERC721A } from "erc721a/contracts/IERC721A.sol";
import { IERC721Receiver } from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
contract Bridge is IERC721Receiver {

    // Error
    error NonExistentItem();

    // Event
    event Import(address indexed user, address indexed item, uint256 indexed tokenId);
    event Export(address indexed user, address indexed item, uint256 indexed tokenId);

    // user => item => ids 
    mapping(address => mapping(address => uint256[])) importedItems;

    // user => item => tokenId => index
    mapping(address => mapping(address => mapping(uint256 => uint256))) private tokenIndex;

    function importItem(address _item, uint256 _tokenId) external {
        _importItem(_item, _tokenId);
    }

    function importItems(
        address[] memory _items, 
        uint256[] memory _tokenIds
    ) 
        external 
    {
        uint256 size = _items.length;
        address item;
        uint256 tokenId;
        for(uint256 i; i < size; i++) {
            item = _items[i];
            tokenId = _tokenIds[i];
            _importItem(item, tokenId);
        }

    }

    function _importItem(address _item, uint256 _tokenId) private {
        IERC721A(_item).safeTransferFrom(msg.sender, address(this), _tokenId, "");
        importedItems[msg.sender][_item].push(_tokenId);
        emit Import(msg.sender, _item, _tokenId);
    }

    function exportItem(address _item, uint256 _tokenId) external {
        _exportItem(_item, _tokenId);
    }

    function exportItems(
        address[] calldata _items, 
        uint256[] calldata _tokenIds
    ) 
        external 
    {
        uint256 size = _items.length;
        address item;
        uint256 tokenId;
        for(uint256 i; i < size; i++) {
            item = _items[i];
            tokenId = _tokenIds[i];
            _exportItem(item, tokenId);
        }
    }

    function _exportItem(address _item, uint256 _tokenId) private {
        uint256[] storage items = importedItems[msg.sender][_item];
        mapping(uint256 => uint256) storage itemIndex = tokenIndex[msg.sender][_item];

        uint256 size = items.length;
        // Ensure the token exists
        if(itemIndex[_tokenId] < size) revert NonExistentItem();
       
        // Get the index of the tokenId to remove
        uint256 indexToRemove = itemIndex[_tokenId];
        uint256 lastIndex = size - 1;

        // If it's not the last element, swap it with the last
        if (indexToRemove != lastIndex) {
            uint256 lastTokenId = items[lastIndex];
            items[indexToRemove] = lastTokenId;
            itemIndex[lastTokenId] = indexToRemove;
        }

        // Remove the last element from the array
        items.pop();

        // Delete the tokenId from the indices mapping
        delete itemIndex[_tokenId];

        // Transfer the token back to the user
        IERC721A(_item).safeTransferFrom(address(this), msg.sender, _tokenId, "");

        emit Export(msg.sender, _item, _tokenId);
    }


    // Implementation of IERC721Receiver's onERC721Received
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata 
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }



}