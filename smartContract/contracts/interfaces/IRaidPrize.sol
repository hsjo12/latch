// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

interface IRaidPrize {

    error InvalidType();

    /// @dev PrizeType indicates the type of prize:
    /// - ERC20: ERC20 token.
    /// - ERC1155: ERC1155 token.
    enum PrizeType {
        ERC20,
        ERC1155
    }

    struct PrizeInfo {
        PrizeType prizeType;
        address prize;
        uint256 id; // if erc20, id will be [0]
        uint256 quantity;
    }

}