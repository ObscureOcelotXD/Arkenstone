import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import Header from "./components/Header.jsx";
import StatsRow from "./components/StatsRow.jsx";
import DepositCard from "./components/DepositCard.jsx";
import WithdrawCard from "./components/WithdrawCard.jsx";
import RewardsCard from "./components/RewardsCard.jsx";
import SendArknCard from "./components/SendArknCard.jsx";
import ReceiveArknCard from "./components/ReceiveArknCard.jsx";
import StakeArknCard from "./components/StakeArknCard.jsx";
import WithdrawArknCard from "./components/WithdrawArknCard.jsx";
import CollapsibleSection from "./components/CollapsibleSection.jsx";
import STAKING_ABI from "./contracts/ArkenstoneStaking.js";
import TOKEN_ABI from "./contracts/ArkenstoneToken.js";
import { STAKING_ADDRESS, TOKEN_ADDRESS, HARDHAT_CHAIN_ID } from "./contracts/addresses.js";
import "./App.css";

export default function App() {
  const [account, setAccount]               = useState(null);
  const [signer, setSigner]                 = useState(null);
  const [stakingContract, setStakingContract] = useState(null);
  const [tokenContract, setTokenContract]   = useState(null);
  const [chainId, setChainId]               = useState(null);

  const [stakedAmount, setStakedAmount]       = useState(0n);
  const [pendingRewards, setPendingRewards]   = useState(0n);
  const [arknBalance, setArknBalance]         = useState(0n);
  const [arknSupply, setArknSupply]           = useState(0n);
  const [arknStakedAmount, setArknStakedAmount]     = useState(0n);
  const [pendingArknRewards, setPendingArknRewards] = useState(0n);

  const [txStatus, setTxStatus]             = useState(null); // null | "pending" | "success" | "error"
  const [loading, setLoading]               = useState(false);

  const wrongNetwork = chainId !== null && chainId !== HARDHAT_CHAIN_ID;

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not detected. Please install the MetaMask extension.");
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const sign = await provider.getSigner();
      const addr = await sign.getAddress();
      const network = await provider.getNetwork();

      const staking = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, sign);
      const token   = new ethers.Contract(TOKEN_ADDRESS,   TOKEN_ABI,   sign);

      setAccount(addr);
      setSigner(sign);
      setStakingContract(staking);
      setTokenContract(token);
      setChainId(Number(network.chainId));
    } catch (err) {
      console.error("Wallet connection failed:", err);
    }
  };

  const refreshData = useCallback(async () => {
    if (!stakingContract || !tokenContract || !account) return;
    try {
      const [staked, rewards] = await stakingContract.getStakeInfo(account);
      const [arknStaked, arknRewards] = await stakingContract.getArknStakeInfo(account);
      const balance = await tokenContract.balanceOf(account);
      const supply  = await tokenContract.totalSupply();
      setStakedAmount(staked);
      setPendingRewards(rewards);
      setArknStakedAmount(arknStaked);
      setPendingArknRewards(arknRewards);
      setArknBalance(balance);
      setArknSupply(supply);
    } catch (err) {
      console.error("Data refresh failed:", err);
    }
  }, [stakingContract, tokenContract, account]);

  // Auto-refresh every 10 seconds while connected.
  useEffect(() => {
    if (!account) return;
    refreshData();
    const id = setInterval(refreshData, 10_000);
    return () => clearInterval(id);
  }, [account, refreshData]);

  // Track account or network changes in MetaMask.
  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccountsChanged = () => window.location.reload();
    const handleChainChanged    = () => window.location.reload();
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  const withTx = async (fn) => {
    setLoading(true);
    setTxStatus(null);
    try {
      const tx = await fn();
      setTxStatus("pending");
      await tx.wait();
      setTxStatus("success");
      await refreshData();
      setTimeout(() => setTxStatus(null), 4000);
    } catch (err) {
      console.error(err);
      setTxStatus("error");
      setTimeout(() => setTxStatus(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit    = (amount) => withTx(() => stakingContract.deposit({ value: ethers.parseEther(amount) }));
  const handleWithdraw   = (amount) => withTx(() => stakingContract.withdraw(ethers.parseEther(amount)));
  const handleSendArkn   = (to, amount) => withTx(() => tokenContract.transfer(to, ethers.parseEther(amount)));
  const handleDepositArkn = async (amount) => {
    const amountWei = ethers.parseEther(amount);
    const allowance = await tokenContract.allowance(account, STAKING_ADDRESS);
    if (allowance < amountWei) {
      await withTx(() => tokenContract.approve(STAKING_ADDRESS, amountWei));
    }
    await withTx(() => stakingContract.depositArkn(amountWei));
  };
  const handleWithdrawArkn = (amount) => withTx(() => stakingContract.withdrawArkn(ethers.parseEther(amount)));
  const handleClaimAll = async () => {
    const [ethPending, arknPending] = await Promise.all([
      stakingContract.getPendingRewards(account),
      stakingContract.getPendingArknRewards(account),
    ]);
    if (ethPending > 0n) await withTx(() => stakingContract.claimRewards());
    if (arknPending > 0n) await withTx(() => stakingContract.claimArknRewards());
  };

  return (
    <div className="app">
      <Header account={account} onConnect={connectWallet} />

      {wrongNetwork && (
        <div className="network-warning">
          Wrong network detected. Please switch MetaMask to <strong>Hardhat Localhost</strong> (chain ID 31337).
        </div>
      )}

      {!account ? (
        <div className="connect-screen">
          <div className="connect-screen__gem">◆</div>
          <h1 className="connect-screen__title">Arkenstone</h1>
          <p className="connect-screen__sub">Deposit ETH. Earn ARKN.</p>
          <button className="btn btn--primary btn--lg" onClick={connectWallet}>
            Connect Wallet
          </button>
        </div>
      ) : (
        <main className="main">
          <StatsRow
            stakedAmount={stakedAmount}
            pendingRewards={pendingRewards}
            arknBalance={arknBalance}
            arknStakedAmount={arknStakedAmount}
            pendingArknRewards={pendingArknRewards}
            arknSupply={arknSupply}
          />

          {/* 1. Staking rewards — own row at top */}
          <CollapsibleSection title="Staking rewards" defaultOpen={true}>
            <div className="cards-grid cards-grid--single">
              <RewardsCard
                onClaimAll={handleClaimAll}
                loading={loading}
                pendingRewards={pendingRewards}
                pendingArknRewards={pendingArknRewards}
              />
            </div>
          </CollapsibleSection>

          {/* 2. ARKN token — send, receive, stake (more ERC-20 rows can follow this pattern later) */}
          <CollapsibleSection title="ARKN token" defaultOpen={true}>
            <div className="cards-grid cards-grid--four">
              <SendArknCard    tokenContract={tokenContract} onSend={handleSendArkn}    loading={loading} arknBalance={arknBalance} />
              <ReceiveArknCard account={account} />
              <StakeArknCard   onStakeArkn={handleDepositArkn} loading={loading} arknBalance={arknBalance} />
              <WithdrawArknCard onWithdrawArkn={handleWithdrawArkn} loading={loading} arknStakedAmount={arknStakedAmount} />
            </div>
          </CollapsibleSection>

          {/* 3. ETH (and future other tokens can get their own section) */}
          <CollapsibleSection title="ETH" defaultOpen={true}>
            <div className="cards-grid cards-grid--two">
              <DepositCard   onDeposit={handleDeposit}   loading={loading} />
              <WithdrawCard
                onWithdraw={handleWithdraw}
                loading={loading}
                stakedAmount={stakedAmount}
                pendingRewards={pendingRewards}
              />
            </div>
          </CollapsibleSection>

          {txStatus && (
            <div className={`toast toast--${txStatus}`}>
              {txStatus === "pending" && "⏳ Transaction pending…"}
              {txStatus === "success" && "✓ Transaction confirmed!"}
              {txStatus === "error"   && "✕ Transaction failed — check the console."}
            </div>
          )}
        </main>
      )}
    </div>
  );
}
