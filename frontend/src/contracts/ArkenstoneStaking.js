// Human-readable ABI for ArkenstoneStaking
const ABI = [
  "function deposit() payable",
  "function withdraw(uint256 amount)",
  "function claimRewards()",
  "function getPendingRewards(address user) view returns (uint256)",
  "function getStakeInfo(address user) view returns (uint256 stakedAmount, uint256 pendingRewards, uint256 lastUpdateTime)",
  "function rewardRate() view returns (uint256)",
  "function owner() view returns (address)",
  "event Deposited(address indexed user, uint256 amount)",
  "event Withdrawn(address indexed user, uint256 amount)",
  "event RewardsClaimed(address indexed user, uint256 amount)",
];

export default ABI;
