// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ArkenstoneToken.sol";

contract ArkenstoneStaking is ReentrancyGuard {
    ArkenstoneToken public immutable arkn;

    uint256 public constant SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
    uint256 public constant MIN_INTEREST_RATE_BPS = 100;   // 1%
    uint256 public constant MAX_INTEREST_RATE_BPS = 1000;  // 10%

    // Interest rate in basis points (e.g. 400 = 4% APY). Set by admin portal.
    uint256 public interestRateBps = 400;
    uint256 public arknInterestRateBps = 400;

    address public owner;

    // TVL: total value locked (wei) for indexing / admin / subgraph
    uint256 public totalEthStaked;
    uint256 public totalArknStaked;

    struct StakeInfo {
        uint256 amount;
        uint256 lastUpdateTime;
        uint256 accumulatedRewards;
    }

    mapping(address => StakeInfo) public stakes;
    mapping(address => StakeInfo) public arknStakes;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event InterestRateUpdated(uint256 oldBps, uint256 newBps);

    event ArknDeposited(address indexed user, uint256 amount);
    event ArknWithdrawn(address indexed user, uint256 amount);
    event ArknRewardsClaimed(address indexed user, uint256 amount);
    event ArknInterestRateUpdated(uint256 oldBps, uint256 newBps);

    error ZeroAddress();
    error ZeroAmount();
    error InsufficientStake();
    error NoRewards();
    error NotOwner();
    error RateOutOfRange();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address _arkn) {
        if (_arkn == address(0)) revert ZeroAddress();
        arkn = ArkenstoneToken(_arkn);
        owner = msg.sender;
    }

    // ─── ETH staking ───────────────────────────────────────────────────────
    function deposit() external payable nonReentrant {
        if (msg.value == 0) revert ZeroAmount();

        StakeInfo storage stake = stakes[msg.sender];
        if (stake.amount > 0) {
            stake.accumulatedRewards += _pendingRewards(stake);
        }

        stake.amount += msg.value;
        stake.lastUpdateTime = block.timestamp;
        totalEthStaked += msg.value;

        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        StakeInfo storage stake = stakes[msg.sender];
        if (stake.amount < amount) revert InsufficientStake();

        uint256 totalRewards = stake.accumulatedRewards + _pendingRewards(stake);

        stake.amount -= amount;
        stake.accumulatedRewards = 0;
        stake.lastUpdateTime = stake.amount == 0 ? 0 : block.timestamp;
        totalEthStaked -= amount;

        if (totalRewards > 0) {
            arkn.mint(msg.sender, totalRewards);
            emit RewardsClaimed(msg.sender, totalRewards);
        }

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "ETH transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    function claimRewards() external nonReentrant {
        StakeInfo storage stake = stakes[msg.sender];
        uint256 totalRewards = stake.accumulatedRewards + _pendingRewards(stake);
        if (totalRewards == 0) revert NoRewards();

        stake.accumulatedRewards = 0;
        stake.lastUpdateTime = block.timestamp;

        arkn.mint(msg.sender, totalRewards);
        emit RewardsClaimed(msg.sender, totalRewards);
    }

    function getPendingRewards(address user) external view returns (uint256) {
        StakeInfo memory stake = stakes[user];
        return stake.accumulatedRewards + _pendingRewards(stake);
    }

    function getStakeInfo(address user) external view returns (
        uint256 stakedAmount,
        uint256 pendingRewards,
        uint256 lastUpdateTime
    ) {
        StakeInfo memory stake = stakes[user];
        stakedAmount = stake.amount;
        pendingRewards = stake.accumulatedRewards + _pendingRewards(stake);
        lastUpdateTime = stake.lastUpdateTime;
    }

    /// @notice Set ETH pool interest rate (basis points). Clamped to [MIN_INTEREST_RATE_BPS, MAX_INTEREST_RATE_BPS].
    function setInterestRateBps(uint256 bps) external onlyOwner {
        if (bps < MIN_INTEREST_RATE_BPS || bps > MAX_INTEREST_RATE_BPS) revert RateOutOfRange();
        uint256 oldBps = interestRateBps;
        interestRateBps = bps;
        emit InterestRateUpdated(oldBps, bps);
    }

    // ─── ARKN staking ───────────────────────────────────────────────────────
    function depositArkn(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();

        StakeInfo storage stake = arknStakes[msg.sender];
        if (stake.amount > 0) {
            stake.accumulatedRewards += _pendingArknRewards(stake);
        }

        stake.amount += amount;
        stake.lastUpdateTime = block.timestamp;
        totalArknStaked += amount;

        require(arkn.transferFrom(msg.sender, address(this), amount), "ARKN transfer failed");
        emit ArknDeposited(msg.sender, amount);
    }

    function withdrawArkn(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        StakeInfo storage stake = arknStakes[msg.sender];
        if (stake.amount < amount) revert InsufficientStake();

        uint256 totalRewards = stake.accumulatedRewards + _pendingArknRewards(stake);

        stake.amount -= amount;
        stake.accumulatedRewards = 0;
        stake.lastUpdateTime = stake.amount == 0 ? 0 : block.timestamp;
        totalArknStaked -= amount;

        if (totalRewards > 0) {
            arkn.mint(msg.sender, totalRewards);
            emit ArknRewardsClaimed(msg.sender, totalRewards);
        }

        require(arkn.transfer(msg.sender, amount), "ARKN transfer failed");
        emit ArknWithdrawn(msg.sender, amount);
    }

    function claimArknRewards() external nonReentrant {
        StakeInfo storage stake = arknStakes[msg.sender];
        uint256 totalRewards = stake.accumulatedRewards + _pendingArknRewards(stake);
        if (totalRewards == 0) revert NoRewards();

        stake.accumulatedRewards = 0;
        stake.lastUpdateTime = block.timestamp;

        arkn.mint(msg.sender, totalRewards);
        emit ArknRewardsClaimed(msg.sender, totalRewards);
    }

    function getArknStakeInfo(address user) external view returns (
        uint256 stakedAmount,
        uint256 pendingRewards,
        uint256 lastUpdateTime
    ) {
        StakeInfo memory stake = arknStakes[user];
        stakedAmount = stake.amount;
        pendingRewards = stake.accumulatedRewards + _pendingArknRewards(stake);
        lastUpdateTime = stake.lastUpdateTime;
    }

    function getPendingArknRewards(address user) external view returns (uint256) {
        StakeInfo memory stake = arknStakes[user];
        return stake.accumulatedRewards + _pendingArknRewards(stake);
    }

    /// @notice Set ARKN pool interest rate (basis points). Clamped to [MIN_INTEREST_RATE_BPS, MAX_INTEREST_RATE_BPS].
    function setArknInterestRateBps(uint256 bps) external onlyOwner {
        if (bps < MIN_INTEREST_RATE_BPS || bps > MAX_INTEREST_RATE_BPS) revert RateOutOfRange();
        uint256 oldBps = arknInterestRateBps;
        arknInterestRateBps = bps;
        emit ArknInterestRateUpdated(oldBps, bps);
    }

    // ─── TVL (for admin portal / The Graph) ───────────────────────────────────
    /// @notice Total value locked: (total ETH staked in wei, total ARKN staked in wei).
    function getTVL() external view returns (uint256 totalEth, uint256 totalArkn) {
        return (totalEthStaked, totalArknStaked);
    }

    // ─── Internal reward math (basis points → per-second rate) ─────────────────
    function _pendingRewards(StakeInfo memory stake) internal view returns (uint256) {
        if (stake.amount == 0 || stake.lastUpdateTime == 0) return 0;
        uint256 duration = block.timestamp - stake.lastUpdateTime;
        return (stake.amount * interestRateBps * duration) / (10000 * SECONDS_PER_YEAR);
    }

    function _pendingArknRewards(StakeInfo memory stake) internal view returns (uint256) {
        if (stake.amount == 0 || stake.lastUpdateTime == 0) return 0;
        uint256 duration = block.timestamp - stake.lastUpdateTime;
        return (stake.amount * arknInterestRateBps * duration) / (10000 * SECONDS_PER_YEAR);
    }
}
