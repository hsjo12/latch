// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IPvpAndRaidVault } from "../interfaces/IPvpAndRaidVault.sol";
import { IRaidPrize } from "../interfaces/IRaidPrize.sol";
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

    event Create(uint256 indexed id, address indexed creator);
    event Join(uint256 indexed id, address indexed participant, uint256 raidFee);
    event Remove(uint256 indexed id, address indexed participant);
    event ClaimPrize(uint256 indexed id, address indexed winner);

    struct RaidInfo {
        prizeInfo[] prizeInfo;
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

    // Id => index
    mapping(uint256 => uint256) public raidIdIndex;
    // Id => RaidInfo
    mapping(uint256 => RaidInfo) public raidInfoInfoById;
    // Id => user => RaidId
    mapping(uint256 => mapping(address => RaidStatus)) public raidStatusByUser;
    
    uint256[] private raidIdList;
    uint256 private id;
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

    function announce(
        uint256 _id
    ) 
        external
        onlyRole(MANAGER) 
    {
        RaidInfo storage raid = raidInfoInfoById[_id];
        raid.isRaidCompleted = true; 
    }

    function createRaid(
        prizeInfo[] memory _prizeInfoList,
        uint256 _raidFee,
        uint64 _openingTime,
        uint64 _closingTime,
        uint64 _maxParticipants 
    ) 
        external 
        onlyRole(MANAGER) 
    {
        if (_openingTime < block.timestamp || _closingTime < _openingTime) revert InvalidTimeRange();
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
        newRaid.participants = new address[](_maxParticipants);
    
        // Copy prizeInfo from calldata to storage
        for (uint256 i = 0; i < size; i++) {
            prizeTransfer(msg.sender, _prizeInfoList[i]);
            newRaid.prizeInfo.push(_prizeInfoList[i]); // Push each element into the storage array
        }
    
        emit Create(id++, msg.sender);
    }
    
    function joinRaid(uint256 _id) external {
        RaidInfo storage raid = raidInfoInfoById[_id];

        if(raid.maxParticipants == raid.participants.length + 1) revert RaidFull();
        if(raid.isRaidCompleted || raid.closingTime < block.timestamp) revert RaidClosed();
        if(raid.openingTime < block.timestamp) revert RaidNotReady();

        uint256 raidFee = raid.raidFee;
        battingToken.transferFrom(msg.sender, teamVault, raidFee); 

        raid.participants.push(msg.sender);
        raidStatusByUser[_id][msg.sender] = RaidStatus({
            IsUserJoined : true,
            IsPrizeClaimed : false
        });
        emit Join(_id, msg.sender, raidFee);
    }

    function removeRaid(uint256 _id) external onlyRole(MANAGER) {
        RaidInfo storage raid = raidInfoInfoById[_id];
        if(raid.isRaidCompleted) revert RaidClosed();
     
        _removeIndexOfId(_id);

        delete raidIdIndex[_id];
        delete raidInfoInfoById[_id];

        uint256 size = raid.prizeInfo.length;
        for(uint256 i; i < size; i++) {
            prizeTransfer(msg.sender, raid.prizeInfo[i]);
        }
        emit Remove(_id, msg.sender);
    }

    function claimPrize(uint256 _id) external {
        RaidInfo storage raid = raidInfoInfoById[_id];
        RaidStatus storage raidStatus = raidStatusByUser[_id][msg.sender];
        if(!raid.isRaidCompleted) revert RaidNotCompleted();
        if(!raidStatus.IsUserJoined) revert UserNotParticipated();
        if(raidStatus.IsPrizeClaimed) revert PrizeAlreadyClaimed();

        uint256 size = raid.prizeInfo.length;
        for(uint256 i; i < size; i++) {
            prizeTransfer(msg.sender, raid.prizeInfo[i]);
        }
        raidStatus.IsPrizeClaimed = true;
        _removeIndexOfId(_id);
        emit ClaimPrize(_id, msg.sender);
    }

    function raidIdsList (
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
        for(uint256 i; i < _size; i++) {
            _list[i] = raidIds[_offset++];
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

}