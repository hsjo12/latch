// SPDX-License-Identifier: MIT
pragma solidity =0.8.28;

import {IBridgeVault} from "../interfaces/IBridgeVault.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
contract Bridge is AccessControl {
    
    bytes32 constant MANAGER = 0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c;
    
    // Error
    error MultipleItemsNotAllowed();
    error NonExistentItem();
    error InvalidItemType();

    // Event
    event Import(address indexed user, address indexed item, uint256 indexed tokenId);
    event Export(address indexed user, address indexed item, uint256 indexed tokenId);

    //Enum
    enum ItemType {
        NONE,
        ERC721,
        ERC1155
    }

    // user => item address
    mapping(address => address[]) importedItemAddresses;
    mapping(address => mapping(address => uint256)) private itemAddressIndex;

    // user => item => ids 
    mapping(address => mapping(address => uint256[])) importedItemIds;

    // user => item => tokenId => index
    mapping(address => mapping(address => mapping(uint256 => uint256))) private tokenIndex;

    // user => item => tokenID => bool
    mapping(address => mapping(address => mapping(uint256 => bool))) public isItemImported;

    IBridgeVault public bridgeVault;

    constructor(IBridgeVault _bridgeVault) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER, msg.sender);
        bridgeVault = _bridgeVault;
    }

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
        
        if (_findItemType(_item) == ItemType.ERC721) {
            IERC721(_item).safeTransferFrom(msg.sender, address(bridgeVault), _tokenId, "");
        } else if (_findItemType(_item) == ItemType.ERC1155) {
            if (isItemImported[msg.sender][_item][_tokenId]) revert MultipleItemsNotAllowed();
            IERC1155(_item).safeTransferFrom(msg.sender, address(bridgeVault), _tokenId, 1, "");
            isItemImported[msg.sender][_item][_tokenId] = true;
        } else {
            revert InvalidItemType();
        }

        uint256[] storage items = importedItemIds[msg.sender][_item];

        if(items.length == 0) {
            itemAddressIndex[msg.sender][_item] = importedItemAddresses[msg.sender].length;
            importedItemAddresses[msg.sender].push(_item);
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
        if(itemIndex[_tokenId] >= size) revert NonExistentItem();
       
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
            lastIndex = importedItemAddresses[msg.sender].length - 1;

            if (indexToRemove != lastIndex) {
                address lastItemAddress = importedItemAddresses[msg.sender][lastIndex];
                importedItemAddresses[msg.sender][indexToRemove] = lastItemAddress;
                itemAddressIndex[msg.sender][lastItemAddress] = indexToRemove;
            }

            importedItemAddresses[msg.sender].pop();
            delete itemAddressIndex[msg.sender][_item];
        }

        // Transfer the token back to the user
        if(_findItemType(_item) == ItemType.ERC721) {
            bridgeVault.moveERC721Item(msg.sender, _item, _tokenId);
        }else if(_findItemType(_item) == ItemType.ERC1155) {
            bridgeVault.moveERC1155Item(msg.sender, _item, _tokenId);
            isItemImported[msg.sender][_item][_tokenId] = false;
        }else{
            revert InvalidItemType();
        }
        
        emit Export(msg.sender, _item, _tokenId);
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
        address[] storage importedItemAddrList = importedItemAddresses[_user];
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
        return importedItemAddresses[_user].length;
    }
    
    function userHasItem(
        address _user, 
        address _item
    ) 
        external 
        view
        returns(bool)
    {
        return importedItemIds[_user][_item].length > 0;
    }

    function setBridgeVault(IBridgeVault _bridgeVault) external onlyRole(MANAGER) {
        bridgeVault = _bridgeVault;
    }

    function _findItemType(
        address _token
    ) 
        private 
        view 
        returns (ItemType) 
    {
        // Check if the address is valid and is a contract
        if (_token == address(0) || !isContract(_token)) {
            return ItemType.NONE;
        }

        // Check if the token supports ERC1155 interface
        try IERC1155(_token).supportsInterface(0xd9b67a26) returns (bool isERC1155) {
            if (isERC1155) return ItemType.ERC1155;
        } catch {
            // Ignore errors for ERC1155 check
        }

        // Check if the token supports ERC721 interface
        try IERC721(_token).supportsInterface(0x80ac58cd) returns (bool isERC721) {
            if (isERC721) return ItemType.ERC721;
        } catch {
            // Ignore errors for ERC721 check
        }

        // If neither interface is supported, return NONE
        return ItemType.NONE;
    }

    function isContract(address account) private view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }


}