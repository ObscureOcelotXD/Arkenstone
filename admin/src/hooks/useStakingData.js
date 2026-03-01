import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { STAKING_ADDRESS, RPC_URL, STAKING_ABI } from "../config/contracts.js";

export function useStakingData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    totalEthStaked: 0n,
    totalArknStaked: 0n,
    interestRateBps: null,
    arknInterestRateBps: null,
  });

  useEffect(() => {
    let cancelled = false;
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, provider);

    async function fetchData() {
      try {
        const [tvl, ethBps, arknBps] = await Promise.all([
          contract.getTVL(),
          contract.interestRateBps(),
          contract.arknInterestRateBps(),
        ]);
        if (cancelled) return;
        setData({
          totalEthStaked: tvl[0],
          totalArknStaked: tvl[1],
          interestRateBps: ethBps,
          arknInterestRateBps: arknBps,
        });
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to fetch staking data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}
