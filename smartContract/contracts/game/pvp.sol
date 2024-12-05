// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IPvpAndRaidVault } from "../interfaces/IPvpAndRaidVault.sol";

contract Pvp is AccessControl {

    bytes32 constant MANAGER = 0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c;
    uint256 constant BPS = 10_000;

    error PvpNotFound();
    error CannotBeCreator();
    error ParticipantExists();
    error OnlyCreator();
    error OnlyWinner();
    error AlreadyClaimed();

    event Result(uint256 indexed id, address indexed creator);
    event Create(uint256 indexed id, address indexed creator, uint256 amount);
    event Join(uint256 indexed id, address indexed participant, uint256 amount);
    event Remove(uint256 indexed id, address indexed participant, uint256 amount);
    event ClaimPrize(uint256 indexed id, address indexed winner, uint256 amount);

    struct PvpInfo {
        address creator; 
        address participant;
        address winner;
        uint256 battingFee;
        uint256 totalPrize;
        bool isPrizeClaimed;
    }

    struct IdIndices {
        uint256 idIndexInPvpByUserList;
        uint256 idIndexInPvpList;
    }

    // Id => index
    mapping(uint256 => IdIndices) public idIndex;
    // User => Ids
    mapping(address => uint256[]) private pvpByUser;
    // Id => PvpInfo
    mapping(uint256 => PvpInfo) public pvpInfoById;
    uint256[] private pvpIdList;

    uint256 public id;
    uint16 public teamTax;
    address public pvpVault;
    address public teamVault;
    IERC20 public battingToken; 
    
    constructor(
        IERC20 _battingToken,
        address _manager,
        address _pvpVault,
        address _teamVault
    ) {
        teamTax = 1000; // 10%
        battingToken = _battingToken;
        pvpVault = _pvpVault;
        teamVault = _teamVault;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER, _manager);
    }

    function announce(
        address _winner, 
        uint256 _id
    ) 
        external
        onlyRole(MANAGER) 
    {
        PvpInfo storage pvp = pvpInfoById[_id];
        uint256 toTeam = (pvp.totalPrize * teamTax) / BPS;
        uint256 toWinner = pvp.totalPrize - toTeam;
        IPvpAndRaidVault(pvpVault).MoveToken(msg.sender, toTeam);
        pvp.totalPrize = toWinner;
        pvp.winner = _winner;

        emit Result(_id, _winner);
    }

    function createPvp(uint256 _amount) external {
        battingToken.transferFrom(msg.sender, pvpVault, _amount);
        uint256 pvpId = id;
        idIndex[pvpId] = IdIndices({
            idIndexInPvpByUserList:pvpByUser[msg.sender].length,
            idIndexInPvpList:pvpIdList.length
        });
        pvpByUser[msg.sender].push(pvpId);
        pvpIdList.push(pvpId);
        pvpInfoById[pvpId] = PvpInfo({
            creator: msg.sender, 
            participant: address(0), 
            winner: address(0), 
            battingFee:_amount,
            totalPrize:_amount,
            isPrizeClaimed:false
        });

        emit Create(id++, msg.sender, _amount);
    }
    
    function joinPvp(uint256 _id) external {
        PvpInfo storage pvp = pvpInfoById[_id];
        if(pvp.creator == address(0)) revert PvpNotFound();
        if(pvp.creator == msg.sender) revert CannotBeCreator();
        if(pvp.participant != address(0)) revert ParticipantExists();

        uint256 amount = pvp.battingFee;
        battingToken.transferFrom(msg.sender, pvpVault, amount); 
  
        pvp.participant = msg.sender;
        pvp.totalPrize *= 2;
        emit Join(_id, msg.sender, amount);
    }

    function removePvp(uint256 _id) external {
        PvpInfo storage pvp = pvpInfoById[_id];
        if(pvp.creator != msg.sender) revert OnlyCreator();
        if(pvp.participant != address(0)) revert ParticipantExists();

        _removeIndexOfId(_id);

        uint256 battingFee = pvp.battingFee; 

        delete idIndex[_id];
        delete pvpInfoById[_id];

        battingToken.transfer(msg.sender, battingFee); 
        emit Remove(_id, msg.sender, battingFee);
    }

    function claimPrize(uint256 _id) external {
        PvpInfo storage pvp = pvpInfoById[_id];
        if(pvp.winner != msg.sender) revert OnlyWinner();
        if(pvp.isPrizeClaimed) revert AlreadyClaimed();
        IPvpAndRaidVault(pvpVault).MoveToken(msg.sender, pvp.totalPrize);
        _removeIndexOfId(_id);
        delete idIndex[_id];
        emit ClaimPrize(_id, msg.sender, pvp.totalPrize);
    }

    function setTeamTax(uint16 _teamTax) external onlyRole(MANAGER) {
        teamTax = _teamTax;
    }

    function battleIdsListByUser (
        address _user,
        uint256 _offset,
        uint256 _size
    ) 
        external 
        view 
        returns (
            uint256[] memory list
        ) 
    {   
        uint256[] storage pvpIdsInUser = pvpByUser[_user];
        uint256 length = pvpIdsInUser.length;

        _size = length > _size + _offset ? _size : length - _offset;
        list = new uint256[](_size);  
        for(uint256 i; i < _size; i++) {
            list[i] = pvpIdsInUser[_offset++];
        }        
       
    }

    function battleIdsList (
        uint256 _offset,
        uint256 _size
    ) 
        external 
        view 
        returns (
            uint256[] memory list
        ) 
    {   
        uint256[] storage pvpIds = pvpIdList;
        uint256 length = pvpIds.length;

        _size = length > _size + _offset ? _size : length - _offset;
        list = new uint256[](_size);  
        for(uint256 i; i < _size; i++) {
            list[i] = pvpIds[_offset++];
        }        
       
    }

    function _removeIndexOfId(uint256 _id) private {
        uint256[] storage pvpIdsInUserList = pvpByUser[msg.sender];
        uint256[] storage pvpIds = pvpIdList;

        uint256 index = idIndex[_id].idIndexInPvpByUserList;
        uint256 lastIndex = pvpIdsInUserList.length - 1;
        if (index != lastIndex) {
            uint256 lastId = pvpIdsInUserList[lastIndex];
            pvpIdsInUserList[index] = lastId;
            pvpIdsInUserList[lastId] = index;
        }

        index = idIndex[_id].idIndexInPvpList;
        lastIndex = pvpIds.length - 1;
        if (index != lastIndex) {
            uint256 lastId = pvpIds[lastIndex];
            pvpIds[index] = lastId;
            pvpIds[lastId] = index;
        }

        pvpIdsInUserList.pop();
        pvpIds.pop();

    }


}