// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;
import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IFriendTechV1.sol";

contract FriendWrap is ERC1155, Ownable {
    address public friendTechContract;
    uint256 public decimals = 10**8;
    IFriendTechV1 public friendTechInstance;

    constructor(address owner, address _friendTechContract) ERC1155("") {
        friendTechContract = _friendTechContract;
        friendTechInstance = IFriendTechV1(_friendTechContract);
        _transferOwnership(owner);
    }

    receive() external payable {}

    // Mint shares means you order the contract to buy shares for you
    function mintShares(address sharesSubject, uint256 amount) public payable {
        // Call friendTech contract to buy shares
        friendTechInstance.buyShares{value: msg.value}(sharesSubject, amount);
        // The call went through, mint tokens to the caller
        _mint(msg.sender, uint256(uint160(sharesSubject)), amount * decimals, "");
    }

    // Redeem shares means you ask the contract to sell shares for you
    function redeemShares(address sharesSubject, uint256 amount) public payable {
        // Burn tokens
        _burn(msg.sender, uint256(uint160(sharesSubject)), amount * decimals);
        // Call friendTech contract to sell shares
        uint256 initialBalance = address(this).balance;
        friendTechInstance.sellShares(sharesSubject, amount);
        uint256 balanceDifference = address(this).balance - initialBalance;
        // Pay back the user
        (bool success, ) = msg.sender.call{value: balanceDifference}("");
        require(success, "Unable to send funds");
    }
}
