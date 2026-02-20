import { useState } from "react";
import { ethers } from "ethers";

export default function WithdrawCard({ onWithdraw, loading, stakedAmount }) {
  const [amount, setAmount] = useState("");

  const maxEth = stakedAmount > 0n
    ? parseFloat(ethers.formatEther(stakedAmount)).toFixed(6)
    : "0";

  const setMax = () => setAmount(maxEth);

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
          <div className="card__subtitle">Also claims all pending ARKN</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div className="input-group">
          <label htmlFor="withdraw-amount">Amount</label>
          <div className="input-wrap">
            <input
              id="withdraw-amount"
              type="number"
              step="any"
              min="0"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading || stakedAmount === 0n}
              style={overMax ? { borderColor: "var(--error-text)" } : {}}
            />
            <span
              className="input-max"
              onClick={setMax}
              title="Use max staked amount"
              style={{ right: "46px" }}
            >
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
