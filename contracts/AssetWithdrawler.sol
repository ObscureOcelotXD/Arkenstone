// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AssetReceiver.sol";

contract AssetWithdrawler {
    AssetReceiver public assetReceiver;
    address public recipient;  // The address where withdrawn Ether will be sent.

    // Constructor accepts the address of an already deployed AssetReceiver and the recipient address.
    constructor(address assetReceiverAddress, address _recipient) {
        // Note: Casting assetReceiverAddress to payable is necessary in this context.
        assetReceiver = AssetReceiver(payable(assetReceiverAddress));
        recipient = _recipient;
    }

    // Trigger the withdrawal from the AssetReceiver.
    // This function calls the withdrawEther function on the AssetReceiver contract,
    // sending all of its Ether balance to the pre-defined recipient.
    function withdrawAllEther() external {
        assetReceiver.withdrawEther(payable(recipient));
    }
}
