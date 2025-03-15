// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AssetReceiver is ReentrancyGuard {
    // Events to log incoming transfers
    event EtherReceived(address indexed sender, uint256 amount);
    event TokensReceived(address indexed token, address indexed sender, uint256 amount);

    // Function to receive Ether when no data is sent
    receive() external payable {
        emit EtherReceived(msg.sender, msg.value);
    }

    // Fallback function to handle calls with data
    fallback() external payable {
        emit EtherReceived(msg.sender, msg.value);
    }

    // Existing function to receive a single token transfer
    function receiveTokens(address tokenAddress, uint256 amount) external nonReentrant {
        IERC20 token = IERC20(tokenAddress);
        require(token.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        emit TokensReceived(tokenAddress, msg.sender, amount);
    }

    // New function to deposit multiple tokens along with Ether in one transaction.
    // The function is payable so that the user can send Ether (accessible via msg.value)
    function depositAssets(address[] calldata tokenAddresses, uint256[] calldata amounts) external payable nonReentrant {
        require(tokenAddresses.length == amounts.length, "Arrays must be equal length");

        // If Ether is sent, emit the corresponding event.
        if (msg.value > 0) {
            emit EtherReceived(msg.sender, msg.value);
        }

        // Process each token deposit
        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            IERC20 token = IERC20(tokenAddresses[i]);
            uint256 amount = amounts[i];
            require(token.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
            emit TokensReceived(tokenAddresses[i], msg.sender, amount);
        }
    }

    // Function to return the Ether balance held by the contract
    function getEtherBalance() public view returns (uint256) {
        return address(this).balance;
    }

    // Function to return the token balance for a given ERC‑20 token
    function tokenBalance(address tokenAddress) public view returns (uint256) {
        return IERC20(tokenAddress).balanceOf(address(this));
    }

    // Helper function that returns an asset summary for a single token
    function getAssetSummary(address tokenAddress) public view returns (uint256 etherBalance, uint256 tokenBal) {
        etherBalance = address(this).balance;
        tokenBal = IERC20(tokenAddress).balanceOf(address(this));
    }

    // New function to retrieve balances for multiple tokens
    function getMultipleTokenBalances(address[] calldata tokenAddresses) external view returns (uint256[] memory balances) {
        balances = new uint256[](tokenAddresses.length);
        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            balances[i] = IERC20(tokenAddresses[i]).balanceOf(address(this));
        }
    }
}
