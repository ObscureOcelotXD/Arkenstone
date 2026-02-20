// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ArkenstoneToken.sol";

contract ArkenstoneStaking is ReentrancyGuard {
    ArkenstoneToken public immutable arkn;

    // ~100 ARKN per ETH per day. Adjustable by owner.
    uint256 public rewardRate = 1157407407407407;
    address public owner;

    struct StakeInfo {
        uint256 amount;               // ETH currently staked
        uint256 lastUpdateTime;       // timestamp of last deposit/claim/withdraw
        uint256 accumulatedRewards;   // rewards snapshotted on updates
    }

    mapping(address => StakeInfo) public stakes;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);

    error ZeroAddress();
    error ZeroAmount();
    error InsufficientStake();
    error NoRewards();
    error NotOwner();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address _arkn) {
        if (_arkn == address(0)) revert ZeroAddress();
        arkn = ArkenstoneToken(_arkn);
        owner = msg.sender;
    }

    // Deposit ETH to start earning ARKN rewards.
    function deposit() external payable nonReentrant {
        if (msg.value == 0) revert ZeroAmount();

        StakeInfo storage stake = stakes[msg.sender];

        // Snapshot pending rewards before changing the stake amount.
        if (stake.amount > 0) {
            stake.accumulatedRewards += _pendingRewards(stake);
        }

        stake.amount += msg.value;
        stake.lastUpdateTime = block.timestamp;

        emit Deposited(msg.sender, msg.value);
    }

    // Withdraw staked ETH. Automatically claims all pending ARKN rewards.
    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        StakeInfo storage stake = stakes[msg.sender];
        if (stake.amount < amount) revert InsufficientStake();

        uint256 totalRewards = stake.accumulatedRewards + _pendingRewards(stake);

        stake.amount -= amount;
        stake.accumulatedRewards = 0;
        stake.lastUpdateTime = stake.amount == 0 ? 0 : block.timestamp;

        if (totalRewards > 0) {
            arkn.mint(msg.sender, totalRewards);
            emit RewardsClaimed(msg.sender, totalRewards);
        }

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "ETH transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    // Claim all accumulated ARKN rewards without touching the stake.
    function claimRewards() external nonReentrant {
        StakeInfo storage stake = stakes[msg.sender];
        uint256 totalRewards = stake.accumulatedRewards + _pendingRewards(stake);
        if (totalRewards == 0) revert NoRewards();

        stake.accumulatedRewards = 0;
        stake.lastUpdateTime = block.timestamp;

        arkn.mint(msg.sender, totalRewards);
        emit RewardsClaimed(msg.sender, totalRewards);
    }

    // Returns total pending ARKN rewards for a user (snapshotted + accruing).
    function getPendingRewards(address user) external view returns (uint256) {
        StakeInfo memory stake = stakes[user];
        return stake.accumulatedRewards + _pendingRewards(stake);
    }

    // Returns a summary of a user's stake position.
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

    function setRewardRate(uint256 _rewardRate) external onlyOwner {
        emit RewardRateUpdated(rewardRate, _rewardRate);
        rewardRate = _rewardRate;
    }

    function _pendingRewards(StakeInfo memory stake) internal view returns (uint256) {
        if (stake.amount == 0 || stake.lastUpdateTime == 0) return 0;
        uint256 duration = block.timestamp - stake.lastUpdateTime;
        return (stake.amount * rewardRate * duration) / 1e18;
    }
}
