// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { IERC1155 } from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

abstract contract IRaidPrize {
    /// @dev PrizeType indicates the type of prize:
    /// - ERC20: ERC20 token.
    /// - ERC721: ERC721 token.
    /// - ERC1155: ERC1155 token.
    /// - None: Not supported type.
    enum PrizeType {
        ERC20,
        ERC721,
        ERC1155
    }

    struct prizeInfo {
        PrizeType priseType;
        address prize;
        uint256 id; // if erc20, id will be 0
        uint256 quantity;
    }

    
    function prizeTransfer(
        address _to,
        prizeInfo memory _prizeInfo
    ) 
        internal 
    {
        if(_prizeInfo.priseType == PrizeType.ERC20) {
            //slither-disable-next-line arbitrary-send per
            IERC20(_prizeInfo.prize).transferFrom(msg.sender, _to, _prizeInfo.quantity);
        } else if(_prizeInfo.priseType == PrizeType.ERC721) {
            IERC721(_prizeInfo.prize).safeTransferFrom(msg.sender, _to, _prizeInfo.id);
        } else{
            IERC1155(_prizeInfo.prize).safeTransferFrom(msg.sender, _to, _prizeInfo.id, _prizeInfo.quantity,"");
        }
    }
    
}