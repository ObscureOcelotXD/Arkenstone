import { useState } from "react";
import { ethers } from "ethers";

export default function SendArknCard({ tokenContract, onSend, loading, arknBalance }) {
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");

  const maxArkn = arknBalance > 0n
    ? parseFloat(ethers.formatEther(arknBalance)).toFixed(6)
    : "0";

  const setMax = () => setAmount(maxArkn);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!toAddress.trim() || !amount || parseFloat(amount) <= 0) return;
    onSend(toAddress.trim(), amount);
    setAmount("");
    setToAddress("");
  };

  const overMax = amount && arknBalance > 0n
    ? parseFloat(amount) > parseFloat(ethers.formatEther(arknBalance))
    : false;
  const isAddress = toAddress.trim().length === 42 && toAddress.startsWith("0x");

  return (
    <div className="card">
      <div className="card__header">
        <div className="card__icon">→</div>
        <div>
          <div className="card__title">Send ARKN</div>
          <div className="card__subtitle">Transfer ARKN to another address</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div className="input-group">
          <label htmlFor="send-to">Recipient address</label>
          <input
            id="send-to"
            type="text"
            placeholder="0x..."
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            disabled={loading}
            className="input-text"
          />
        </div>

        <div className="input-group">
          <label htmlFor="send-amount">Amount</label>
          <div className={`input-wrap ${overMax ? "input-wrap--error" : ""}`}>
            <input
              id="send-amount"
              type="number"
              step="any"
              min="0"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
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
          className="btn btn--outline btn--full"
          disabled={loading || !amount || parseFloat(amount) <= 0 || overMax || !isAddress || arknBalance === 0n}
        >
          {loading ? "Processing…" : "Send ARKN"}
        </button>
      </form>
    </div>
  );
}
