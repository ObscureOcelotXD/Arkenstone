// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AssetReceiver.sol";

contract AssetWithdrawler {
    AssetReceiver public assetReceiver;
    address public recipient;  // The address where withdrawn Ether will be sent.

    constructor(address assetReceiverAddress, address _recipient) {
        // Cast assetReceiverAddress as payable.
        assetReceiver = AssetReceiver(payable(assetReceiverAddress));
        recipient = _recipient;
    }

    // Withdraw a specified amount of Ether from AssetReceiver.
    function withdrawEther(uint256 amount) external {
        assetReceiver.withdrawEther(payable(recipient), amount);
    }
}
