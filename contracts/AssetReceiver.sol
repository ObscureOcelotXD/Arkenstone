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

    // Deposit a single ERC‑20 token.
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

    // Get the contract's Ether balance.
    function getEtherBalance() public view returns (uint256) {
        return address(this).balance;
    }

    // Get the contract's balance for a specific token.
    function tokenBalance(address tokenAddress) public view returns (uint256) {
        return IERC20(tokenAddress).balanceOf(address(this));
    }

    // Get a summary: Ether balance and token balance for a specific token.
    function getAssetSummary(address tokenAddress) public view returns (uint256 etherBalance, uint256 tokenBal) {
        etherBalance = address(this).balance;
        tokenBal = IERC20(tokenAddress).balanceOf(address(this));
    }

    // Get multiple token balances.
    function getMultipleTokenBalances(address[] calldata tokenAddresses) external view returns (uint256[] memory balances) {
        balances = new uint256[](tokenAddresses.length);
        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            balances[i] = IERC20(tokenAddresses[i]).balanceOf(address(this));
        }
    }
    
    // Withdraw a specified amount of Ether. If requested exceeds balance, withdraw the full balance.
    function withdrawEther(address payable recipient, uint256 amount) external onlyWithdrawler nonReentrant {
        uint256 currentBalance = address(this).balance;
        uint256 amountToWithdraw = amount > currentBalance ? currentBalance : amount;
        require(amountToWithdraw > 0, "No Ether to withdraw");
        (bool success, ) = recipient.call{value: amountToWithdraw}("");
        require(success, "Ether withdrawal failed");
    }
    
    // New function: Withdraw a specified amount of an ERC‑20 token.
    // If requested exceeds balance, withdraw the full available balance.
    function withdrawToken(address tokenAddress, address recipient, uint256 amount) external onlyWithdrawler nonReentrant {
        IERC20 token = IERC20(tokenAddress);
        uint256 currentBalance = token.balanceOf(address(this));
        uint256 amountToWithdraw = amount > currentBalance ? currentBalance : amount;
        require(amountToWithdraw > 0, "No tokens to withdraw");
        bool success = token.transfer(recipient, amountToWithdraw);
        require(success, "Token withdrawal failed");
    }
}
