// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AssetReceiver is ReentrancyGuard {
    // The address authorized to perform withdrawals.
    address public withdrawler;

    event EtherReceived(address indexed sender, uint256 amount);
    event TokensReceived(address indexed token, address indexed sender, uint256 amount);

    constructor() {
        // Set the deployer as the default withdrawler.
        withdrawler = msg.sender;
    }

    modifier onlyWithdrawler() {
        require(msg.sender == withdrawler, "Not authorized");
        _;
    }

    // Allows the current withdrawler to update the withdrawler address.
    function setWithdrawler(address _withdrawler) external onlyWithdrawler {
        withdrawler = _withdrawler;
    }

    // Receive Ether.
    receive() external payable {
        emit EtherReceived(msg.sender, msg.value);
    }

    // Fallback function.
    fallback() external payable {
        emit EtherReceived(msg.sender, msg.value);
    }

    // Receive a single ERC-20 token deposit.
    function receiveTokens(address tokenAddress, uint256 amount) external nonReentrant {
        IERC20 token = IERC20(tokenAddress);
        require(token.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        emit TokensReceived(tokenAddress, msg.sender, amount);
    }

    // Deposit Ether and multiple tokens in one transaction.
    function depositAssets(address[] calldata tokenAddresses, uint256[] calldata amounts) external payable nonReentrant {
        require(tokenAddresses.length == amounts.length, "Arrays must be equal length");

        if (msg.value > 0) {
            emit EtherReceived(msg.sender, msg.value);
        }

        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            IERC20 token = IERC20(tokenAddresses[i]);
            uint256 amount = amounts[i];
            require(token.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
            emit TokensReceived(tokenAddresses[i], msg.sender, amount);
        }
    }

    // Returns the Ether balance held by the contract.
    function getEtherBalance() public view returns (uint256) {
        return address(this).balance;
    }

    // Returns the token balance for a given ERC-20 token.
    function tokenBalance(address tokenAddress) public view returns (uint256) {
        return IERC20(tokenAddress).balanceOf(address(this));
    }

    // Returns a summary: Ether balance and the balance for a given token.
    function getAssetSummary(address tokenAddress) public view returns (uint256 etherBalance, uint256 tokenBal) {
        etherBalance = address(this).balance;
        tokenBal = IERC20(tokenAddress).balanceOf(address(this));
    }

    // Returns balances for multiple token addresses.
    function getMultipleTokenBalances(address[] calldata tokenAddresses) external view returns (uint256[] memory balances) {
        balances = new uint256[](tokenAddresses.length);
        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            balances[i] = IERC20(tokenAddresses[i]).balanceOf(address(this));
        }
    }
    
    // Updated withdrawEther function: if the requested amount exceeds available balance,
    // withdraw the maximum available amount.
    function withdrawEther(address payable recipient, uint256 amount) external onlyWithdrawler nonReentrant {
        uint256 currentBalance = address(this).balance;
        // If requested amount is more than available, withdraw the full balance.
        uint256 amountToWithdraw = amount > currentBalance ? currentBalance : amount;
        require(amountToWithdraw > 0, "No Ether to withdraw");
        (bool success, ) = recipient.call{value: amountToWithdraw}("");
        require(success, "Ether withdrawal failed");
    }
}
