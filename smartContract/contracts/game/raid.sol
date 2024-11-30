// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Raid is AccessControl {

    bytes32 constant MANAGER = 0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c;

    error BattleNotFound();
    error ParticipantExists();
    error OnlyCreator();

    event Result(uint256 indexed id, address indexed creator);
    event Create(uint256 indexed id, address indexed creator, uint256 amount);
    event Join(uint256 indexed id, address indexed participant, uint256 amount);
    event Remove(uint256 indexed id, address indexed participant, uint256 amount);
    
    struct Raid {
        address[] prizes;
        uint256[] quantities;
        bool result;
    }
    // Id => room index
    mapping(uint256 => uint256) public roomIndexInUserList;
    // User => room Ids
    mapping(address => uint256[]) public roomListByUser;
    // Room id => Battle
    mapping(uint256 => Raid) public battleInfoById;

    uint256 private id;

    IERC20 public battingToken; 
    
    constructor(IERC20 _battingToken,address _manager) {
        battingToken = _battingToken;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER, _manager);
    }

    function result(
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
        roomIndexInUserList[battleId] = roomListByUser[msg.sender].length;
        roomListByUser[msg.sender].push(battleId);
        battleInfoById[battleId] = Battle({
            creator: msg.sender, 
            participant: address(0), 
            winner: address(0), 
            battingFee:_amount,
            currentBalance:_amount
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
        battle.currentBalance *= 2;
        emit Create(_id, msg.sender, amount);
    }

    function removeBattle(uint256 _id) external {
        Battle storage battle = battleInfoById[_id];
        if(battle.creator != msg.sender) revert OnlyCreator();
        if(battle.participant != address(0)) revert ParticipantExists();

        uint256[] storage battleIdList = roomListByUser[msg.sender];
        uint256 index = roomIndexInUserList[_id];
        uint256 lastIndex = battleIdList.length - 1;

        if (index != lastIndex) {
            uint256 lastId = battleIdList[lastIndex];
            battleIdList[index] = lastId;
            roomIndexInUserList[lastId] = index;
        }

        battleIdList.pop();

        uint256 battingFee = battle.battingFee; 

        delete roomIndexInUserList[_id];
        delete battleInfoById[_id];

        battingToken.transfer(msg.sender, battingFee); 
        emit Remove(_id, msg.sender, battingFee);
    }


}