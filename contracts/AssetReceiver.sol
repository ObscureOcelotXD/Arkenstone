// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AssetReceiver is ReentrancyGuard {
    // The address authorized to withdraw funds.
    address public withdrawler;

    event EtherReceived(address indexed sender, uint256 amount);
    event TokensReceived(address indexed token, address indexed sender, uint256 amount);

    constructor() {
        // By default, the deployer is set as the withdrawler.
        withdrawler = msg.sender;
    }

    // Modifier to restrict access to the withdrawler.
    modifier onlyWithdrawler() {
        require(msg.sender == withdrawler, "Not authorized");
        _;
    }

    // Function to update the withdrawler address.
    // Only the current withdrawler can change it.
    function setWithdrawler(address _withdrawler) external onlyWithdrawler {
        withdrawler = _withdrawler;
    }

    // Accept Ether transfers.
    receive() external payable {
        emit EtherReceived(msg.sender, msg.value);
    }

    fallback() external payable {
        emit EtherReceived(msg.sender, msg.value);
    }

    // Function to receive a single ERC-20 token deposit.
    function receiveTokens(address tokenAddress, uint256 amount) external nonReentrant {
        IERC20 token = IERC20(tokenAddress);
        require(token.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        emit TokensReceived(tokenAddress, msg.sender, amount);
    }

    // Deposit multiple tokens and Ether in one transaction.
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

    // Returns a summary: the contract's Ether balance and the token balance for a given token.
    function getAssetSummary(address tokenAddress) public view returns (uint256 etherBalance, uint256 tokenBal) {
        etherBalance = address(this).balance;
        tokenBal = IERC20(tokenAddress).balanceOf(address(this));
    }

    // Returns an array of balances for multiple token addresses.
    function getMultipleTokenBalances(address[] calldata tokenAddresses) external view returns (uint256[] memory balances) {
        balances = new uint256[](tokenAddresses.length);
        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            balances[i] = IERC20(tokenAddresses[i]).balanceOf(address(this));
        }
    }
    
    // New withdrawal function: Sends all Ether in the contract to a specified recipient.
    // Only callable by the authorized withdrawler.
    function withdrawEther(address payable recipient) external onlyWithdrawler nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No Ether to withdraw");
        (bool success, ) = recipient.call{value: balance}("");
        require(success, "Ether withdrawal failed");
    }
}
