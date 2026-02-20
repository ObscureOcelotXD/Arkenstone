// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./AssetReceiver.sol";

contract AssetWithdrawler {
    AssetReceiver public assetReceiver;
    address public recipient;
    address public owner;

    event EtherWithdrawn(address indexed recipient, uint256 amount);
    event TokenWithdrawn(address indexed token, address indexed recipient, uint256 amount);

    error NotOwner();
    error ZeroAddress();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address assetReceiverAddress, address _recipient) {
        if (assetReceiverAddress == address(0) || _recipient == address(0)) revert ZeroAddress();
        assetReceiver = AssetReceiver(payable(assetReceiverAddress));
        recipient = _recipient;
        owner = msg.sender;
    }

    // Withdraw a specified amount of Ether.
    function withdrawEther(uint256 amount) external onlyOwner {
        assetReceiver.withdrawEther(payable(recipient), amount);
        emit EtherWithdrawn(recipient, amount);
    }

    // Withdraw a specified amount of an ERC-20 token.
    function withdrawToken(address tokenAddress, uint256 amount) external onlyOwner {
        assetReceiver.withdrawToken(tokenAddress, recipient, amount);
        emit TokenWithdrawn(tokenAddress, recipient, amount);
    }
}
