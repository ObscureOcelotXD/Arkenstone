import { useState } from "react";

export default function DepositCard({ onDeposit, loading }) {
  const [amount, setAmount] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    onDeposit(amount);
    setAmount("");
  };

  return (
    <div className="card">
      <div className="card__header">
        <div className="card__icon">⬇</div>
        <div>
          <div className="card__title">Deposit ETH</div>
          <div className="card__subtitle">Start earning ARKN rewards</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div className="input-group">
          <label htmlFor="deposit-amount">Amount</label>
          <div className="input-wrap">
            <input
              id="deposit-amount"
              type="number"
              step="any"
              min="0"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
            />
            <span className="input-suffix">ETH</span>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn--primary btn--full"
          disabled={loading || !amount || parseFloat(amount) <= 0}
        >
          {loading ? "Processing…" : "Deposit ETH"}
        </button>
      </form>

      <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
        Rewards begin accruing immediately and can be claimed at any time.
      </p>
    </div>
  );
}
