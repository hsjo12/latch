// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;



import { ERC721AQueryable, ERC721A, IERC721A } from "erc721a/contracts/extensions/ERC721AQueryable.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Items is  ERC721AQueryable, AccessControl {

    bytes32 constant TOKEN_MINTER = 0x262c70cb68844873654dc54487b634cb00850c1e13c785cd0d96a2b89b829472;
    bytes32 constant MANAGER = 0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c;
 
    error InsufficientAmount();
    event RequiredMints(address indexed user, uint256 quantity);

    enum ItemType { Weapon, Armour, Boots }
    struct Stats {
        uint64 atk;
        uint64 def;
        uint64 speed;
        uint64 durability;
    }

    struct Item {
        ItemType itemType;
        Stats stats;
    }

    mapping(uint256 => Item) public itemInfo;
    uint256 public price = 1 ether;
    address public itemPaymentVault;
    IERC20 gameToken;

    constructor(
        address _tokenMinter,
        address _itemPaymentVault, 
        IERC20 _gameToken
    ) 
        ERC721A("Items", "Items") 
    {
        gameToken = _gameToken;
        itemPaymentVault = _itemPaymentVault;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER, msg.sender);
        _grantRole(TOKEN_MINTER, _tokenMinter);
    }

    function requireMint(uint256 _quantity) external {
        gameToken.transferFrom(msg.sender, itemPaymentVault, _quantity * price);
        emit RequiredMints(msg.sender, _quantity);
    }

    function mintItem(
        address _receiver,
        ItemType _itemType,
        Stats calldata _stats
    ) 
        external 
        onlyRole(TOKEN_MINTER)
    {
        itemInfo[_nextTokenId()] = Item({
            itemType: _itemType,
            stats: _stats
        });
        _mint(_receiver, 1);
    }

    function mintItems(
        address _receiver,
        ItemType[] calldata _itemType,
        Stats[] calldata _stats
  
    ) 
        external 
        onlyRole(TOKEN_MINTER)
    {
        uint256 startTokenId = _nextTokenId();
        uint256 size = _itemType.length;
        for(uint256 i; i < size; i++) {
            itemInfo[startTokenId++] = Item({
                itemType: _itemType[i],
                stats: _stats[i]
            });
        }
        _mint(_receiver, size);       
    }

    function setPrice(
        uint256 _price
    ) 
        external 
        onlyRole(MANAGER) 
    {
        price = _price;
    }

    function setItemPaymentVault(
        address _itemPaymentVault
    ) 
        external 
        onlyRole(MANAGER) 
    {
        itemPaymentVault = _itemPaymentVault;
    }

    function setGameToken(
        IERC20 _gameToken
    ) 
        external 
        onlyRole(MANAGER) 
    {
        gameToken = _gameToken;
    }

    function getItemInfoList(
        uint256[] calldata _id
    ) 
        external 
        view 
        returns(Item[] memory _itemInfoList) 
    {
        uint256 size = _id.length;
        _itemInfoList = new Item[](size);

        for(uint256 i; i < size; i++) {
            _itemInfoList[i] = itemInfo[i];
        }
    }
 
    function supportsInterface(
        bytes4 interfaceId
    ) 
        public 
        view 
        override(AccessControl, IERC721A, ERC721A) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
   

}