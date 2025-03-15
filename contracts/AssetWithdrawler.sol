// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AssetReceiver.sol";

contract AssetWithdrawler {
    AssetReceiver public assetReceiver;
    address public recipient;  // The address to which assets will be withdrawn.

    constructor(address assetReceiverAddress, address _recipient) {
        assetReceiver = AssetReceiver(payable(assetReceiverAddress));
        recipient = _recipient;
    }

    // Withdraw a specified amount of Ether.
    function withdrawEther(uint256 amount) external {
        assetReceiver.withdrawEther(payable(recipient), amount);
    }

    // Withdraw a specified amount of an ERC‑20 token.
    function withdrawToken(address tokenAddress, uint256 amount) external {
        assetReceiver.withdrawToken(tokenAddress, recipient, amount);
    }
}
