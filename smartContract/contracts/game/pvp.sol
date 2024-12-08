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
    error AlreadyInvolvedInPVP();
    error AlreadyAnnounced();
    error InvalidWinner();

    event Announce(uint256 indexed id, address indexed winner, uint256 totalPrize);
    event Create(uint256 indexed id, address indexed creator, uint256 battingAmount);
    event Join(uint256 indexed id, address indexed participant, uint256 battingAmount);
    event Remove(uint256 indexed id, address indexed participant, uint256 battingAmount);
    
    struct PvpInfo {
        address creator; 
        address participant;
        address winner;
        uint256 battingFee;
        uint256 totalPrize;
        bool isWinnerAnnounced;
    }

    // User => Id
    mapping(address => uint256) public pvpByUser;
    // Id => PvpInfo
    mapping(uint256 => PvpInfo) public pvpInfoById;
    // Id => index
    mapping(uint256 => uint256) public pvpIdIndex;
    uint256[] private pvpIdList;

    uint256 public id = 1;
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

    function createPvp(uint256 _amount) external {
        if (pvpByUser[msg.sender] != 0) revert AlreadyInvolvedInPVP();
        battingToken.transferFrom(msg.sender, pvpVault, _amount);
        uint256 pvpId = id;
        pvpIdIndex[pvpId] = pvpIdList.length;
        pvpByUser[msg.sender] = pvpId;
        pvpIdList.push(pvpId);
        pvpInfoById[pvpId] = PvpInfo({
            creator: msg.sender, 
            participant: address(0), 
            winner: address(0), 
            battingFee:_amount,
            totalPrize:_amount,
            isWinnerAnnounced:false
        });

        emit Create(id++, msg.sender, _amount);
    }
    
    function joinPvp(uint256 _id) external {
        PvpInfo storage pvp = pvpInfoById[_id];
        if (pvp.creator == address(0)) revert PvpNotFound();
        if (pvp.creator == msg.sender) revert CannotBeCreator();
        if (pvp.participant != address(0)) revert ParticipantExists();

        pvpByUser[msg.sender] = _id;
        uint256 amount = pvp.battingFee;
        battingToken.transferFrom(msg.sender, pvpVault, amount); 
  
        pvp.participant = msg.sender;
        pvp.totalPrize *= 2;
        emit Join(_id, msg.sender, amount);
    }

    function removePvp(uint256 _id) external {
        PvpInfo storage pvp = pvpInfoById[_id];
        if (pvp.creator != msg.sender) revert OnlyCreator();
        if (pvp.participant != address(0)) revert ParticipantExists();

        uint256 battingFee = pvp.battingFee; 
        _removeIndexOfId(_id);
        delete pvpByUser[msg.sender];
        delete pvpIdIndex[_id];
        delete pvpInfoById[_id];

        IPvpAndRaidVault(pvpVault).moveToken(msg.sender, battingFee);
        emit Remove(_id, msg.sender, battingFee);
    }

    function announce(
        address _winner, 
        uint256 _id
    ) 
        external
        onlyRole(MANAGER) 
    {
        PvpInfo storage pvp = pvpInfoById[_id];
        if (pvp.isWinnerAnnounced) revert AlreadyAnnounced();
        if (_winner != pvp.creator && _winner != pvp.participant) revert InvalidWinner();
        uint256 toTeam = (pvp.totalPrize * teamTax) / BPS;
        uint256 toWinner = pvp.totalPrize - toTeam;
        pvp.totalPrize = toWinner;
        pvp.winner = _winner;
        pvp.isWinnerAnnounced = true;

        IPvpAndRaidVault(pvpVault).moveToken(teamVault, toTeam);
        IPvpAndRaidVault(pvpVault).moveToken(_winner, toWinner);

        _removeIndexOfId(_id);
        delete pvpByUser[pvp.creator];
        delete pvpByUser[pvp.participant];
        delete pvpIdIndex[_id];
        emit Announce(_id, _winner, toWinner);
    }

    function setTeamTax(uint16 _teamTax) external onlyRole(MANAGER) {
        teamTax = _teamTax;
    }

    function setPvpVault(address _pvpVault) external onlyRole(MANAGER) {
        pvpVault = _pvpVault;
    }

    function setTeamVault(address _teamVault) external onlyRole(MANAGER) {
        teamVault = _teamVault;
    }

    function setBattingToken(IERC20 _battingToken) external onlyRole(MANAGER) {
        battingToken = _battingToken;
    }

 
    function pvpIdsList (
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
        for (uint256 i; i < _size; i++) {
            list[i] = pvpIds[_offset++];
        }        
       
    }

    function _removeIndexOfId(uint256 _id) private {
        uint256[] storage pvpIds = pvpIdList;
        uint256 index = pvpIdIndex[_id];
        uint256 lastIndex = pvpIds.length - 1;

        if (index != lastIndex) {
            uint256 lastId = pvpIds[lastIndex];
            pvpIds[index] = lastId;
            pvpIds[lastId] = index;
        }

        pvpIds.pop();
    }


}