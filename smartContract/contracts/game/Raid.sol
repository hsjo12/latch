// SPDX-License-Identifier: MIT
pragma solidity =0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IPvpAndRaidVault} from "../interfaces/IPvpAndRaidVault.sol";
import {IRaidPrize} from "../interfaces/IRaidPrize.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

contract Raid is AccessControl, IRaidPrize {

    bytes32 constant MANAGER = 0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c;
    uint256 constant BPS = 10_000;

    error InvalidTimeRange();
    error RaidFull();
    error RaidClosed();
    error RaidNotReady();
    error RaidNotCompleted();
    error UserNotParticipated();
    error PrizeAlreadyClaimed();
    error NoRemainingPrize();

    event Create(uint256 indexed id, address indexed creator);
    event Join(uint256 indexed id, address indexed participant, uint256 raidFee);
    event Remove(uint256 indexed id, address indexed participant);
    event ClaimPrize(uint256 indexed id, address indexed winner);
    
    struct RaidInfo {
        PrizeInfo[] prizeInfo;
        address[] participants;
        uint256 raidFee;
        uint64 openingTime;
        uint64 closingTime;
        uint64 maxParticipants;
        bool isRaidCompleted;
    }

    struct RaidStatus {
        bool IsUserJoined;
        bool IsPrizeClaimed;
    }

    struct UserRaidInfo {
        uint256[] userRaidIds;
        // id => RaidStatus
        mapping(uint256 => RaidStatus) raidStatus;
    }

    // Id => index
    mapping(uint256 => uint256) private raidIdIndex;
    // Id => RaidInfo
    mapping(uint256 => RaidInfo) private raidInfoInfoById;
    // user => UserRaidInfo
    mapping(address => UserRaidInfo) private userRaidInfo;
    // user => id => index
    mapping(address => mapping(uint256 => uint256)) private userRaidIdIndex;

    uint256[] private raidIdList;
    uint256 public id;
    address public raidVault;
    address public teamVault;
    IERC20 public battingToken; 

    constructor(
        IERC20 _battingToken,
        address _manager,
        address _raidVault,
        address _teamVault
    ) 
    {
        battingToken = _battingToken;
        raidVault = _raidVault;
        teamVault = _teamVault;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER, _manager);
    }

    function createRaid(
        PrizeInfo[] memory _prizeInfoList,
        uint256 _raidFee,
        uint64 _openingTime,
        uint64 _closingTime,
        uint64 _maxParticipants 
    ) 
        external 
        onlyRole(MANAGER) 
    {
        if (_closingTime < _openingTime) revert InvalidTimeRange();
        uint256 size = _prizeInfoList.length;
    
        uint256 raidId = id;
        raidIdIndex[raidId] = raidIdList.length;
        raidIdList.push(raidId);
    
        RaidInfo storage newRaid = raidInfoInfoById[raidId];
        newRaid.raidFee = _raidFee;
        newRaid.openingTime = _openingTime;
        newRaid.closingTime = _closingTime;
        newRaid.maxParticipants = _maxParticipants;
        newRaid.isRaidCompleted = false;
       
        for (uint256 i = 0; i < size; i++) {
            _prizeTransfer(raidVault, _prizeInfoList[i]);
            newRaid.prizeInfo.push(_prizeInfoList[i]); // Push each element into the storage array
        }
    
        emit Create(id++, msg.sender);
    }
    
    function joinRaid(uint256 _id) external {
        RaidInfo storage raid = raidInfoInfoById[_id];

        if (raid.participants.length >= raid.maxParticipants) revert RaidFull();
        if (raid.openingTime > block.timestamp) revert RaidNotReady();
        if (raid.isRaidCompleted || raid.closingTime < block.timestamp) revert RaidClosed();


        uint256 raidFee = raid.raidFee;
        battingToken.transferFrom(msg.sender, teamVault, raidFee); 

        raid.participants.push(msg.sender);
        userRaidIdIndex[msg.sender][_id] = userRaidInfo[msg.sender].userRaidIds.length;
        userRaidInfo[msg.sender].userRaidIds.push(_id);
        userRaidInfo[msg.sender].raidStatus[_id].IsUserJoined = true;

        emit Join(_id, msg.sender, raidFee);
    }

    function removeRaid(uint256 _id) external onlyRole(MANAGER) {
        RaidInfo storage raid = raidInfoInfoById[_id];

        _removeIndexOfId(_id);

        delete raidIdIndex[_id];
        delete raidInfoInfoById[_id];

        uint256 size = raid.prizeInfo.length;
        for (uint256 i; i < size; i++) {
            _prizeTransfer(msg.sender, raid.prizeInfo[i]);
        }
        emit Remove(_id, msg.sender);
    }

    function complete(
        uint256 _id
    ) 
        external
        onlyRole(MANAGER) 
    {
        RaidInfo storage raid = raidInfoInfoById[_id];
        if (raid.isRaidCompleted) revert RaidClosed();
        raid.isRaidCompleted = true; 
        _removeIndexOfId(_id);
    }

    function claimPrize(uint256 _id) external {
        RaidInfo storage raid = raidInfoInfoById[_id];
        UserRaidInfo storage userRaid = userRaidInfo[msg.sender];
        RaidStatus storage userRaidStatus = userRaid.raidStatus[_id];
        if (!raid.isRaidCompleted) revert RaidNotCompleted();
        if (!userRaidStatus.IsUserJoined) revert UserNotParticipated();
        if (userRaidStatus.IsPrizeClaimed) revert PrizeAlreadyClaimed();
       
        uint256 size = raid.prizeInfo.length;
        for (uint256 i; i < size; i++) {
            IPvpAndRaidVault(raidVault).moveToken(msg.sender, raid.prizeInfo[i], raid.maxParticipants);
        }
        userRaidStatus.IsPrizeClaimed = true;
        _removeIndexOfUserRaidId(msg.sender, _id);
        
        emit ClaimPrize(_id, msg.sender);
    }

    function withdrawLeftoverPrize(uint256 _id) external onlyRole(MANAGER) {
        RaidInfo storage raid = raidInfoInfoById[_id];
        uint256 totalParticipants = raid.participants.length;
        if (!raid.isRaidCompleted) revert RaidNotCompleted();
        if (raid.maxParticipants == totalParticipants) revert NoRemainingPrize();
        uint256 size = raid.prizeInfo.length;
        for (uint256 i; i < size; i++) {
            IPvpAndRaidVault(raidVault).moveLeftOverToken(msg.sender, raid.prizeInfo[i], raid.maxParticipants, totalParticipants);
        }
    }

    function getRaidInfoInfoById(
        uint256 _id
    ) 
        external 
        view 
        returns ( 
            PrizeInfo[] memory prizeInfoList, 
            address[] memory participantList, 
            uint256 raidFee,
            uint64 openingTime,
            uint64 closingTime,
            uint64 maxParticipants,
            bool isRaidCompleted
        ) 
    {
        RaidInfo storage raid = raidInfoInfoById[_id];
        uint256 size = raid.prizeInfo.length;
        prizeInfoList = new PrizeInfo[](size);

        for (uint256 i; i < size; i++) {
            prizeInfoList[i] = raid.prizeInfo[i];
        }

        size = raid.participants.length;
        participantList = new address[](size);
        for (uint256 i; i < size; i++) {
            participantList[i] = raid.participants[i];
        }

        return (prizeInfoList, 
                participantList, 
                raid.raidFee,
                raid.openingTime,
                raid.closingTime,
                raid.maxParticipants,
                raid.isRaidCompleted);
     
    }

    function getRaidIdList (
        uint256 _offset,
        uint256 _size
    ) 
        external 
        view 
        returns (
            uint256[] memory _list
        ) 
    {   
        uint256[] storage raidIds = raidIdList;
        uint256 length = raidIds.length;

        _size = length > _size + _offset ? _size : length - _offset;
        _list = new uint256[](_size);  
        for (uint256 i; i < _size; i++) {
            _list[i] = raidIds[_offset++];
        }        
       
    }

    function getUserRaidIdList (
        address _user,
        uint256 _offset,
        uint256 _size
    ) 
        external 
        view 
        returns (
            uint256[] memory _list
        ) 
    {   
        uint256[] storage userRaidIds = userRaidInfo[_user].userRaidIds;
        uint256 length = userRaidIds.length;

        _size = length > _size + _offset ? _size : length - _offset;
        _list = new uint256[](_size);  
        for (uint256 i; i < _size; i++) {
            _list[i] = userRaidIds[_offset++];
        }        
       
    }

    function _removeIndexOfId(uint256 _id) private {
        uint256[] storage raidIds = raidIdList;

        uint256 index = raidIdIndex[_id];
        uint256 lastIndex = raidIds.length - 1;
        if (index != lastIndex) {
            uint256 lastId = raidIds[lastIndex];
            raidIds[index] = lastId;
            raidIds[lastId] = index;
        }
        raidIds.pop();
    }

    function _removeIndexOfUserRaidId(
        address _user, 
        uint256 _id
    ) 
        private 
    {
        uint256[] storage userRaidIds = userRaidInfo[_user].userRaidIds;

        uint256 index = userRaidIdIndex[_user][_id];
        uint256 lastIndex = userRaidIds.length - 1;
        if (index != lastIndex) {
            uint256 lastId = userRaidIds[lastIndex];
            userRaidIds[index] = lastId;
            userRaidIds[lastId] = index;
        }
        userRaidIds.pop();
    }

    function _prizeTransfer(
        address _to,
        PrizeInfo memory _prizeInfo
    ) 
        private 
    {
        if (_prizeInfo.prizeType == PrizeType.ERC20) {
            //slither-disable-next-line arbitrary-send per
            IERC20(_prizeInfo.prize).transferFrom(msg.sender, _to, _prizeInfo.quantity);
        } else if (_prizeInfo.prizeType == PrizeType.ERC1155) {
            IERC1155(_prizeInfo.prize).safeTransferFrom(msg.sender, _to, _prizeInfo.id, _prizeInfo.quantity, "");
        } else {
            revert InvalidType();
        }
    }

}