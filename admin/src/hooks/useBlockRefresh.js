import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";

const THROTTLE_MS = 3000;

/**
 * Subscribes to new blocks on the given RPC, throttled to at most one callback per THROTTLE_MS.
 * Returns current block number, timestamp, and chain id; calls onTick when a throttled block arrives.
 */
export function useBlockRefresh(rpcUrl, onTick) {
  const [blockNumber, setBlockNumber] = useState(null);
  const [blockTimestamp, setBlockTimestamp] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastTickRef = useRef(0);
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  useEffect(() => {
    if (!rpcUrl) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    let mounted = true;

    const tick = async (isInitial = false) => {
      const now = Date.now();
      if (!isInitial && now - lastTickRef.current < THROTTLE_MS) return;
      lastTickRef.current = now;
      try {
        const num = await provider.getBlockNumber();
        const block = await provider.getBlock(num);
        const network = await provider.getNetwork();
        if (mounted) {
          setBlockNumber(num);
          setBlockTimestamp(block?.timestamp ?? null);
          setChainId(Number(network.chainId));
          setLoading(false);
          onTickRef.current?.();
        }
      } catch (err) {
        if (mounted) {
          setBlockNumber(null);
          setBlockTimestamp(null);
          setChainId(null);
          setLoading(false);
        }
      }
    };

    const handler = () => {
      tick(false);
    };

    provider.on("block", handler);
    tick(true);

    return () => {
      mounted = false;
      provider.off("block", handler);
    };
  }, [rpcUrl]);

  return { blockNumber, blockTimestamp, chainId, loading };
}
