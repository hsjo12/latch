// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract TestERC1155 is ERC1155 {
    constructor() ERC1155("") {}

    function mint(address _to, uint256 _id, uint256 _value) external {
        _mint(_to, _id, _value, "");
    }
}