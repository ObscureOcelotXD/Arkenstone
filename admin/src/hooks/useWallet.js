import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { STAKING_ADDRESS, STAKING_ABI, CHAIN_ID } from "../config/contracts.js";

export function useWallet() {
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [error, setError] = useState(null);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask not detected");
      return;
    }
    setError(null);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const s = await provider.getSigner();
      const addr = await s.getAddress();
      const { chainId: id } = await provider.getNetwork();
      setSigner(s);
      setAccount(addr);
      setChainId(Number(id));
    } catch (err) {
      setError(err.message || "Failed to connect");
    }
  }, []);

  const disconnect = useCallback(() => {
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;
    const onAccounts = (accounts) => {
      if (accounts.length === 0) disconnect();
    };
    const onChain = () => {
      window.ethereum.request({ method: "eth_chainId" }).then((id) => setChainId(Number(id)));
    };
    window.ethereum.on("accountsChanged", onAccounts);
    window.ethereum.on("chainChanged", onChain);
    return () => {
      window.ethereum.removeListener("accountsChanged", onAccounts);
      window.ethereum.removeListener("chainChanged", onChain);
    };
  }, [disconnect]);

  const stakingContractWithSigner = signer
    ? new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer)
    : null;

  const isRightChain = chainId !== null && chainId === CHAIN_ID;

  return {
    account,
    signer,
    chainId,
    error,
    connect,
    disconnect,
    stakingContractWithSigner,
    isRightChain,
    isConnected: !!account,
  };
}
