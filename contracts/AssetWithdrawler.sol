// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AssetReceiver.sol";

contract AssetWithdrawler {
    AssetReceiver public assetReceiver;
    address public recipient;  // The address to which Ether will be withdrawn.

    constructor(address assetReceiverAddress, address _recipient) {
        assetReceiver = AssetReceiver(payable(assetReceiverAddress));
        recipient = _recipient;
    }

    // New withdrawal function that accepts a withdrawal amount.
    function withdrawEther(uint256 amount) external {
        assetReceiver.withdrawEther(payable(recipient), amount);
    }
}
