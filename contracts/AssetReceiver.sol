// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AssetReceiver is ReentrancyGuard {
    // Events to log incoming transfers
    event EtherReceived(address indexed sender, uint256 amount);
    event TokensReceived(address indexed token, address indexed sender, uint256 amount);

    // Function to receive Ether when msg.data is empty
    receive() external payable {
        emit EtherReceived(msg.sender, msg.value);
    }

    // Fallback function to handle non-empty msg.data transfers
    fallback() external payable {
        emit EtherReceived(msg.sender, msg.value);
    }

    // Function to allow receiving ERC-20 tokens.
    // The caller must have approved this contract to spend the tokens.
    function receiveTokens(address tokenAddress, uint256 amount) external nonReentrant {
        IERC20 token = IERC20(tokenAddress);
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit TokensReceived(tokenAddress, msg.sender, amount);
    }

    // Function to return the Ether balance held by the contract
    function getEtherBalance() public view returns (uint256) {
        return address(this).balance;
    }

    // Function to return the token balance for a given ERC-20 token
    function tokenBalance(address tokenAddress) public view returns (uint256) {
        IERC20 token = IERC20(tokenAddress);
        return token.balanceOf(address(this));
    }

    // New helper function that returns both Ether and token balances
    function getAssetSummary(address tokenAddress) public view returns (uint256 etherBalance, uint256 tokenBal) {
        etherBalance = address(this).balance;
        tokenBal = IERC20(tokenAddress).balanceOf(address(this));
    }
}
