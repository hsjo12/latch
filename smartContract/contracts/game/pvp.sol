// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Pvp is AccessControl {

    bytes32 constant MANAGER = 0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c;
    uint256 constant BPS = 10_000;

    error BattleNotFound();
    error ParticipantExists();
    error OnlyCreator();
    error OnlyWinner();

    event Result(uint256 indexed id, address indexed creator);
    event Create(uint256 indexed id, address indexed creator, uint256 amount);
    event Join(uint256 indexed id, address indexed participant, uint256 amount);
    event Remove(uint256 indexed id, address indexed participant, uint256 amount);

    struct Battle {
        address creator; 
        address participant;
        address winner;
        uint256 battingFee;
        uint256 totalPrize;
    }

    // Id => room index
    mapping(uint256 => uint256) public idIndexInUserList;
    // User => room Ids
    mapping(address => uint256[]) public battlesCreatedByUser;
    // Room id => Battle
    mapping(uint256 => Battle) public battleInfoById;

    uint256 private id;
    uint256 public teamTax;

    IERC20 public battingToken; 
    
    constructor(IERC20 _battingToken,address _manager) {
        teamTax = 1000; // 10%
        battingToken = _battingToken;
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
        battleInfoById[_id].winner = _winner;
        emit Result(_id, _winner);
    }

    function createBattle(uint256 _amount) external {
        battingToken.transferFrom(msg.sender, address(this), _amount);
        uint256 battleId = id;
        idIndexInUserList[battleId] = battlesCreatedByUser[msg.sender].length;
        battlesCreatedByUser[msg.sender].push(battleId);
        battleInfoById[battleId] = Battle({
            creator: msg.sender, 
            participant: address(0), 
            winner: address(0), 
            battingFee:_amount,
            totalPrize:_amount
        });
        emit Create(id++, msg.sender, _amount);
    }
    
    function joinBattle(uint256 _id) external {
        Battle storage battle = battleInfoById[_id];
        if(battle.creator == address(0)) revert BattleNotFound();
        if(battle.participant != address(0)) revert ParticipantExists();

        uint256 amount = battle.battingFee;
        battingToken.transferFrom(msg.sender, address(this), amount); 
  
        battle.participant = msg.sender;
        battle.totalPrize *= 2;
        emit Create(_id, msg.sender, amount);
    }

    function removeBattle(uint256 _id) external {
        Battle storage battle = battleInfoById[_id];
        if(battle.creator != msg.sender) revert OnlyCreator();
        if(battle.participant != address(0)) revert ParticipantExists();

        uint256[] storage battleIdList = battlesCreatedByUser[msg.sender];
        uint256 index = idIndexInUserList[_id];
        uint256 lastIndex = battleIdList.length - 1;

        if (index != lastIndex) {
            uint256 lastId = battleIdList[lastIndex];
            battleIdList[index] = lastId;
            idIndexInUserList[lastId] = index;
        }

        battleIdList.pop();

        uint256 battingFee = battle.battingFee; 

        delete idIndexInUserList[_id];
        delete battleInfoById[_id];

        battingToken.transfer(msg.sender, battingFee); 
        emit Remove(_id, msg.sender, battingFee);
    }

    function claimPrize(uint256 _id) external {
        Battle storage battle = battleInfoById[_id];
        if(battle.winner != msg.sender) revert OnlyWinner();
        Battle storage battle = battleInfoById[_id];
        uint256[] storage battleIdList = battlesCreatedByUser[msg.sender];
        uint256 index = idIndexInUserList[_id];
        uint256 lastIndex = battleIdList.length - 1;

        if (index != lastIndex) {
            uint256 lastId = battleIdList[lastIndex];
            battleIdList[index] = lastId;
            idIndexInUserList[lastId] = index;
        }
        delete idIndexInUserList[_id];
        battingToken.transfer(msg.sender, battle.totalPrize); 
    }

    function battlesCreatedByUser (
        address _user,
        uint256 _offset,
        uint256 _size
    ) 
        external 
        view 
        returns (
            uint256[] memory _userBattlesList
        ) 
    {   
        uint256 _battlesCreatedByUser = battlesCreatedByUser[msg.sender];
        uint256 length = _battlesCreatedByUser.length;

        _size = length > _size + _offset ? _size : length - _offset;
        _userBattlesList = new uint256[](_size);  
        for(uint256 i; i < _size; i++) {
            _userBattlesList[i] = _battlesCreatedByUser[_offset++];
        }        
       
    }

}