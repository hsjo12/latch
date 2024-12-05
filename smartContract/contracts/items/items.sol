// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC721AQueryable, ERC721A, IERC721A } from "erc721a/contracts/extensions/ERC721AQueryable.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IGasback } from "../interfaces/IGasback.sol";
contract Items is  ERC721AQueryable, AccessControl {

    bytes32 constant TOKEN_MINTER = 0x262c70cb68844873654dc54487b634cb00850c1e13c785cd0d96a2b89b829472;
    bytes32 constant MANAGER = 0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c;
    uint256 public constant WEAPON = 1;
    uint256 public constant ARMOUR = 2;
    uint256 public constant BOOTS = 3;

    IGasback public immutable gasback;
    
    event MintRequested(address indexed user, uint256 quantity);
    event ItemMinted(address indexed user, uint256 quantity);

    struct Stats {
        uint64 atk; 
        uint64 def;
        int64 speed;
        uint64 durability;
    }

    struct Item {
        uint256 itemType;
        Stats stats;
    }

    mapping(uint256 => string) public tokenURIByItemType;
    mapping(uint256 => Item) public itemInfo;
    uint256 public price = 1 ether;
    address public teamVault;
    address public owner;
    IERC20 public gameToken;

    constructor(
        IGasback _gasback,
        IERC20 _gameToken,
        address _item_minter,
        address _teamVault
    ) 
        ERC721A("Items", "Items") 
    {
        gasback = _gasback;
        owner = msg.sender;
        gameToken = _gameToken;
        teamVault = _teamVault;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER, msg.sender);
        _grantRole(TOKEN_MINTER, _item_minter);
    }

    function registerForGasback() public onlyRole(DEFAULT_ADMIN_ROLE) {
        gasback.register(owner, address(this));
    }

    function requireMint(uint256 _quantity) external {
        gameToken.transferFrom(msg.sender, teamVault, _quantity * price);
        emit MintRequested(msg.sender, _quantity);
    }

    function mintItems(
        address _receiver,
        uint256[] calldata _itemType,
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
        emit ItemMinted(_receiver, size);     
    }

    function setPrice(
        uint256 _price
    ) 
        external 
        onlyRole(MANAGER) 
    {
        price = _price;
    }

    function setOwner(
        address _owner
    ) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        owner = _owner;
    }

    function setTeamVault(
        address _teamVault
    ) 
        external 
        onlyRole(MANAGER) 
    {
        teamVault = _teamVault;
    }

    function setGameToken(
        IERC20 _gameToken
    ) 
        external 
        onlyRole(MANAGER) 
    {
        gameToken = _gameToken;
    }

    function setTokenURIById(
        uint256 _itemType,
        string calldata _uri
    ) 
        external 
        onlyRole(MANAGER) 
    {
        tokenURIByItemType[_itemType] = _uri;
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
            _itemInfoList[i] = itemInfo[_id[i]];
        }
    }
 
    function tokenURI(
        uint256 _tokenId
    ) 
        public 
        view 
        override(ERC721A, IERC721A) 
        returns (string memory) 
    {
        if (!_exists(_tokenId)) _revert(URIQueryForNonexistentToken.selector);
        return tokenURIByItemType[itemInfo[_tokenId].itemType];
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