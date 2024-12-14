// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.28;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IGasback} from "../interfaces/IGasback.sol";

contract Items is  ERC1155, AccessControl {

    bytes32 constant TOKEN_MINTER = 0x262c70cb68844873654dc54487b634cb00850c1e13c785cd0d96a2b89b829472;
    bytes32 constant MANAGER = 0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c;

    IGasback public immutable gasback;
    
    event MintRequested(address indexed user, uint256 quantity);
    event ItemMinted(address indexed user, uint256 quantity);

    struct Stats {
        uint64 atk; 
        uint64 def;
        int64 speed;
        uint64 durability;
    }

    mapping(uint256 => string) public tokenURIByItemType;
    mapping(uint256 => Stats) public itemInfo;
    uint256 public price = 1 ether;
    address public teamVault;
    address public owner;
    IERC20 public token;
    string public baseURI;
    
    constructor(
        IGasback _gasback,
        IERC20 _token,
        address _item_minter,
        address _teamVault
    ) 
        ERC1155("") 
    {
        gasback = _gasback;
        owner = msg.sender;
        token = _token;
        teamVault = _teamVault;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER, msg.sender);
        _grantRole(TOKEN_MINTER, _item_minter);
    }

    function registerForGasback() public onlyRole(DEFAULT_ADMIN_ROLE) {
        gasback.register(owner, address(this));
    }
    
    function mintItems(uint256 _id, uint256 _quantity) external {
        token.transferFrom(msg.sender, teamVault, _quantity * price);
        _mint(msg.sender, _id, _quantity, ""); 
    }

    function setItemStats(
        uint256[] calldata _idList, 
        Stats[] calldata _statsList
    ) 
        external 
        onlyRole(MANAGER) 
    {
        uint256 size = _idList.length;
        for(uint256 i; i < size; i++) {
            itemInfo[_idList[i]] = _statsList[i];
        }
        
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

    function setToken(
        IERC20 _token
    ) 
        external 
        onlyRole(MANAGER) 
    {
        token = _token;
    }

    function setBaseURI(string memory _baseURI) external onlyRole(MANAGER) {
        baseURI = _baseURI;
    }

    function uri(uint256 _tokenId) public view override returns (string memory) {
        return bytes(baseURI).length > 0 
            ? string.concat(baseURI, Strings.toString(_tokenId), ".json") 
            : "";
    }

    function getItemInfoList(
        uint256[] calldata _id
    ) 
        external 
        view 
        returns (Stats[] memory _itemInfoList) 
    {
        uint256 size = _id.length;
        _itemInfoList = new Stats[](size);
        for (uint256 i; i < size; i++) {
            _itemInfoList[i] = itemInfo[_id[i]];
        }
    }

    function supportsInterface(
        bytes4 interfaceId
    ) 
        public 
        view 
        override(AccessControl, ERC1155) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
}