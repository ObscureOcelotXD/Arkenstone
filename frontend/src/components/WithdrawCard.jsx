import { useState } from "react";
import { ethers } from "ethers";

function fmtArkn(wei) {
  if (wei === 0n) return "0";
  const val = parseFloat(ethers.formatEther(wei));
  return val < 0.0001 ? "< 0.0001" : val.toFixed(4);
}

export default function WithdrawCard({ onWithdraw, loading, stakedAmount, pendingRewards = 0n }) {
  const [amount, setAmount] = useState("");

  const maxEth = stakedAmount > 0n
    ? parseFloat(ethers.formatEther(stakedAmount)).toFixed(6)
    : "0";

  const setMax = () => setAmount(maxEth);

  const hasPendingRewards = pendingRewards > 0n;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    onWithdraw(amount);
    setAmount("");
  };

  const overMax = amount && stakedAmount > 0n
    ? parseFloat(amount) > parseFloat(ethers.formatEther(stakedAmount))
    : false;

  return (
    <div className="card">
      <div className="card__header">
        <div className="card__icon">⬆</div>
        <div>
          <div className="card__title">Withdraw ETH</div>
          <div className="card__subtitle">Also claims all pending ARKN to your wallet</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div className="input-group">
          <label htmlFor="withdraw-amount">Amount</label>
          <div className={`input-wrap ${overMax ? "input-wrap--error" : ""}`}>
            <input
              id="withdraw-amount"
              type="number"
              step="any"
              min="0"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading || stakedAmount === 0n}
            />
            <span className="input-max" onClick={setMax} title="Use max staked amount">
              MAX
            </span>
            <span className="input-suffix">ETH</span>
          </div>
          {overMax && (
            <span style={{ fontSize: "0.78rem", color: "var(--error-text)" }}>
              Exceeds staked balance ({maxEth} ETH)
            </span>
          )}
        </div>

        {hasPendingRewards && (
          <p className="withdraw-pending-note">
            You have <strong>{fmtArkn(pendingRewards)} ARKN</strong> pending — they’ll be claimed when you withdraw.
          </p>
        )}

        <button
          type="submit"
          className="btn btn--outline btn--full"
          disabled={loading || !amount || parseFloat(amount) <= 0 || overMax || stakedAmount === 0n}
        >
          {loading ? "Processing…" : "Withdraw ETH"}
        </button>
      </form>

      <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
        Staked: <strong style={{ color: "var(--text-primary)" }}>{maxEth} ETH</strong>
      </p>
    </div>
  );
}
