import { useState } from "react";
import { ethers } from "ethers";

export default function WithdrawArknCard({ onWithdrawArkn, loading, arknStakedAmount }) {
  const [amount, setAmount] = useState("");

  const maxArkn = arknStakedAmount > 0n
    ? parseFloat(ethers.formatEther(arknStakedAmount)).toFixed(6)
    : "0";

  const setMax = () => setAmount(maxArkn);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    onWithdrawArkn(amount);
    setAmount("");
  };

  const overMax = amount && arknStakedAmount > 0n
    ? parseFloat(amount) > parseFloat(ethers.formatEther(arknStakedAmount))
    : false;

  return (
    <div className="card">
      <div className="card__header">
        <div className="card__icon">⬆</div>
        <div>
          <div className="card__title">Withdraw ARKN</div>
          <div className="card__subtitle">Unstake ARKN (claims pending rewards)</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div className="input-group">
          <label htmlFor="withdraw-arkn-amount">Amount</label>
          <div className={`input-wrap ${overMax ? "input-wrap--error" : ""}`}>
            <input
              id="withdraw-arkn-amount"
              type="number"
              step="any"
              min="0"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading || arknStakedAmount === 0n}
            />
            <span className="input-max" onClick={setMax} title="Use max">MAX</span>
            <span className="input-suffix">ARKN</span>
          </div>
          {overMax && (
            <span style={{ fontSize: "0.78rem", color: "var(--error-text)" }}>
              Exceeds staked ({maxArkn} ARKN)
            </span>
          )}
        </div>

        <button
          type="submit"
          className="btn btn--outline btn--full"
          disabled={loading || !amount || parseFloat(amount) <= 0 || overMax || arknStakedAmount === 0n}
        >
          {loading ? "Processing…" : "Withdraw ARKN"}
        </button>
      </form>

      <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
        Staked: <strong style={{ color: "var(--text-primary)" }}>{maxArkn} ARKN</strong>
      </p>
    </div>
  );
}
