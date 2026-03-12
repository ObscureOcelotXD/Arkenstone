import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { STAKING_ADDRESS, RPC_URL, STAKING_ABI, TOKEN_ABI } from "../config/contracts.js";

export function useStakingData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    totalEthStaked: 0n,
    totalArknStaked: 0n,
    totalArknSupply: 0n,
    interestRateBps: null,
    arknInterestRateBps: null,
  });

  const refetch = useCallback(async () => {
    setLoading(true);
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const staking = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, provider);
    try {
      const tokenAddress = await staking.arkn();
      const token = new ethers.Contract(tokenAddress, TOKEN_ABI, provider);
      const [tvl, ethBps, arknBps, supply] = await Promise.all([
        staking.getTVL(),
        staking.interestRateBps(),
        staking.arknInterestRateBps(),
        token.totalSupply(),
      ]);
      setData({
        totalEthStaked: tvl[0],
        totalArknStaked: tvl[1],
        totalArknSupply: supply,
        interestRateBps: ethBps,
        arknInterestRateBps: arknBps,
      });
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to fetch staking data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
