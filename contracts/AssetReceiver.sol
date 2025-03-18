// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AssetReceiver is ReentrancyGuard {
    // Authorized withdrawler
    address public withdrawler;

    event EtherReceived(address indexed sender, uint256 amount);
    event TokensReceived(address indexed token, address indexed sender, uint256 amount);

    // --- New Storage Duration Tracking ---
    // Record deposit timestamp for ETH per depositor
    mapping(address => uint256) public ethDepositTimestamp;
    // Record deposit timestamp for tokens per depositor per token
    mapping(address => mapping(address => uint256)) public tokenDepositTimestamp;
    // ---------------------------------------

    constructor() {
        withdrawler = msg.sender;
    }

    modifier onlyWithdrawler() {
        require(msg.sender == withdrawler, "Not authorized");
        _;
    }

    function setWithdrawler(address _withdrawler) external onlyWithdrawler {
        withdrawler = _withdrawler;
    }

    // --- ETH Reception ---
    receive() external payable {
        if (msg.value > 0) {
            // Record deposit time for ETH
            ethDepositTimestamp[msg.sender] = block.timestamp;
            emit EtherReceived(msg.sender, msg.value);
        }
    }

    fallback() external payable {
        if (msg.value > 0) {
            ethDepositTimestamp[msg.sender] = block.timestamp;
            emit EtherReceived(msg.sender, msg.value);
        }
    }

    // --- Token Deposit ---
    function receiveTokens(address tokenAddress, uint256 amount) external nonReentrant {
        IERC20 token = IERC20(tokenAddress);
        // Record deposit time for this token for the depositor
        tokenDepositTimestamp[msg.sender][tokenAddress] = block.timestamp;
        require(token.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        emit TokensReceived(tokenAddress, msg.sender, amount);
    }

    // Deposit Ether and tokens in one transaction.
    function depositAssets(address[] calldata tokenAddresses, uint256[] calldata amounts) external payable nonReentrant {
        require(tokenAddresses.length == amounts.length, "Arrays must be equal length");

        if (msg.value > 0) {
            // Record ETH deposit time.
            ethDepositTimestamp[msg.sender] = block.timestamp;
            emit EtherReceived(msg.sender, msg.value);
        }

        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            IERC20 token = IERC20(tokenAddresses[i]);
            // Record token deposit time.
            tokenDepositTimestamp[msg.sender][tokenAddresses[i]] = block.timestamp;
            uint256 amount = amounts[i];
            require(token.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
            emit TokensReceived(tokenAddresses[i], msg.sender, amount);
        }
    }

    // --- View Functions for Storage Duration ---
    // Returns how long (in seconds) the ETH deposit has been stored for a given depositor.
    function getEthStorageDuration(address depositor) public view returns (uint256) {
        require(ethDepositTimestamp[depositor] > 0, "No ETH deposit found");
        return block.timestamp - ethDepositTimestamp[depositor];
    }

    // Returns how long (in seconds) the token deposit has been stored for a given depositor and token.
    function getTokenStorageDuration(address depositor, address tokenAddress) public view returns (uint256) {
        require(tokenDepositTimestamp[depositor][tokenAddress] > 0, "No token deposit found");
        return block.timestamp - tokenDepositTimestamp[depositor][tokenAddress];
    }
    // -------------------------------------------

    function getEtherBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function tokenBalance(address tokenAddress) public view returns (uint256) {
        return IERC20(tokenAddress).balanceOf(address(this));
    }

    function getAssetSummary(address tokenAddress) public view returns (uint256 etherBalance, uint256 tokenBal) {
        etherBalance = address(this).balance;
        tokenBal = IERC20(tokenAddress).balanceOf(address(this));
    }

    function getMultipleTokenBalances(address[] calldata tokenAddresses) external view returns (uint256[] memory balances) {
        balances = new uint256[](tokenAddresses.length);
        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            balances[i] = IERC20(tokenAddresses[i]).balanceOf(address(this));
        }
    }
    
    // Withdrawal functions remain unchanged...
    function withdrawEther(address payable recipient, uint256 amount) external onlyWithdrawler nonReentrant {
        uint256 currentBalance = address(this).balance;
        uint256 amountToWithdraw = amount > currentBalance ? currentBalance : amount;
        require(amountToWithdraw > 0, "No Ether to withdraw");
        (bool success, ) = recipient.call{value: amountToWithdraw}("");
        require(success, "Ether withdrawal failed");
    }
    
    function withdrawToken(address tokenAddress, address recipient, uint256 amount) external onlyWithdrawler nonReentrant {
        IERC20 token = IERC20(tokenAddress);
        uint256 currentBalance = token.balanceOf(address(this));
        uint256 amountToWithdraw = amount > currentBalance ? currentBalance : amount;
        require(amountToWithdraw > 0, "No tokens to withdraw");
        bool success = token.transfer(recipient, amountToWithdraw);
        require(success, "Token withdrawal failed");
    }
}
