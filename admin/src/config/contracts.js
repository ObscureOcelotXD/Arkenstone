// Contract addresses: use env overrides or defaults (e.g. from local deploy)
export const STAKING_ADDRESS =
  import.meta.env.VITE_STAKING_ADDRESS || "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

export const RPC_URL =
  import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545";

export const SUBGRAPH_URL = import.meta.env.VITE_SUBGRAPH_URL || null;

export const CHAIN_ID = 31337;

export const STAKING_ABI = [
  "function getTVL() view returns (uint256 totalEth, uint256 totalArkn)",
  "function totalEthStaked() view returns (uint256)",
  "function totalArknStaked() view returns (uint256)",
  "function interestRateBps() view returns (uint256)",
  "function arknInterestRateBps() view returns (uint256)",
  "function setInterestRateBps(uint256 bps)",
  "function setArknInterestRateBps(uint256 bps)",
  "function owner() view returns (address)",
];
