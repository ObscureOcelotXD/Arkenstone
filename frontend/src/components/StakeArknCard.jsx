import { useState } from "react";
import { ethers } from "ethers";

export default function StakeArknCard({ onStakeArkn, loading, arknBalance }) {
  const [amount, setAmount] = useState("");

  const maxArkn = arknBalance > 0n
    ? parseFloat(ethers.formatEther(arknBalance)).toFixed(6)
    : "0";

  const setMax = () => setAmount(maxArkn);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    onStakeArkn(amount);
    setAmount("");
  };

  const overMax = amount && arknBalance > 0n
    ? parseFloat(amount) > parseFloat(ethers.formatEther(arknBalance))
    : false;

  return (
    <div className="card">
      <div className="card__header">
        <div className="card__icon">◆</div>
        <div>
          <div className="card__title">Stake ARKN</div>
          <div className="card__subtitle">Stake ARKN to earn more ARKN</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div className="input-group">
          <label htmlFor="stake-arkn-amount">Amount</label>
          <div className={`input-wrap ${overMax ? "input-wrap--error" : ""}`}>
            <input
              id="stake-arkn-amount"
              type="number"
              step="any"
              min="0"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading || arknBalance === 0n}
            />
            <span className="input-max" onClick={setMax} title="Use max">MAX</span>
            <span className="input-suffix">ARKN</span>
          </div>
          {overMax && (
            <span style={{ fontSize: "0.78rem", color: "var(--error-text)" }}>
              Exceeds balance ({maxArkn} ARKN)
            </span>
          )}
        </div>

        <button
          type="submit"
          className="btn btn--primary btn--full"
          disabled={loading || !amount || parseFloat(amount) <= 0 || overMax || arknBalance === 0n}
        >
          {loading ? "Processing…" : "Stake ARKN"}
        </button>
      </form>

      <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
        Wallet balance: <strong style={{ color: "var(--text-primary)" }}>{maxArkn} ARKN</strong>
      </p>
    </div>
  );
}
