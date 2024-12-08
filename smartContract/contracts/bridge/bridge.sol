// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { IERC721Receiver } from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
contract Bridge is IERC721Receiver {

    // Error
    error NonExistentItem();

    // Event
    event Import(address indexed user, address indexed item, uint256 indexed tokenId);
    event Export(address indexed user, address indexed item, uint256 indexed tokenId);

    // user => item address
    mapping(address => address[]) importedItemAddrs;
    mapping(address => mapping(address => uint256)) private itemAddressIndex;

    // user => item => ids 
    mapping(address => mapping(address => uint256[])) importedItemIds;

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
        IERC721(_item).safeTransferFrom(msg.sender, address(this), _tokenId, "");
       
        uint256[] storage items = importedItemIds[msg.sender][_item];

        if(items.length == 0) {
            itemAddressIndex[msg.sender][_item] = importedItemAddrs[msg.sender].length;
            importedItemAddrs[msg.sender].push(_item);
        }

        tokenIndex[msg.sender][_item][_tokenId] = items.length;
        items.push(_tokenId);
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
        uint256[] storage items = importedItemIds[msg.sender][_item];
        mapping(uint256 => uint256) storage itemIndex = tokenIndex[msg.sender][_item];

        uint256 size = items.length;
        // Ensure the token exists
        if(itemIndex[_tokenId] > size) revert NonExistentItem();
       
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

        if(items.length == 0) {
            indexToRemove = itemAddressIndex[msg.sender][_item];
            lastIndex = importedItemAddrs[msg.sender].length - 1;

            if (indexToRemove != lastIndex) {
                address lastItemAddress = importedItemAddrs[msg.sender][lastIndex];
                importedItemAddrs[msg.sender][indexToRemove] = lastItemAddress;
                itemAddressIndex[msg.sender][lastItemAddress] = indexToRemove;
            }

            importedItemAddrs[msg.sender].pop();
            delete itemAddressIndex[msg.sender][_item];
        }

        // Transfer the token back to the user
        IERC721(_item).safeTransferFrom(address(this), msg.sender, _tokenId, "");

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

    function importedUserItemList(
        address _user,
        address _item,
        uint256 _offset,
        uint256 _size 
    )
        external
        view
        returns (
            uint256[] memory list
        )
    {
        uint256[] storage importedItemIdList = importedItemIds[_user][_item];
        uint256 length = importedItemIdList.length;

        _size = length > _size + _offset ? _size : length - _offset;
        list = new uint256[](_size);  
        for(uint256 i; i < _size; i++) {
            list[i] = importedItemIdList[_offset++];
        }   
    }

    function totalImportedUserItem(
        address _user, 
        address _item
    ) 
        external
        view
        returns (uint256) 
    {
        return importedItemIds[_user][_item].length;
    } 

    function importedUserItemAddress(
        address _user,
        uint256 _offset,
        uint256 _size 
    )
        external
        view
        returns (
            address[] memory list
        )
    {
        address[] storage importedItemAddrList = importedItemAddrs[_user];
        uint256 length = importedItemAddrList.length;

        _size = length > _size + _offset ? _size : length - _offset;
        list = new address[](_size);  
        for(uint256 i; i < _size; i++) {
            list[i] = importedItemAddrList[_offset++];
        }   
    }

    function totalImportedUserItemAddress(
        address _user 
    ) 
        external
        view
        returns (uint256) 
    {
        return importedItemAddrs[_user].length;
    } 
}