import { useState, useEffect } from "react";
import { ethers } from "ethers";

const MIN_PCT = 1;
const MAX_PCT = 10;

function bpsToPercent(bps) {
  if (bps == null) return "";
  return (Number(bps) / 100).toFixed(1);
}

export default function InterestRateForm({
  stakingContractWithSigner,
  currentEthBps,
  currentArknBps,
  onSuccess,
  disabled,
}) {
  const [ethPct, setEthPct] = useState("");
  const [arknPct, setArknPct] = useState("");
  const [txStatus, setTxStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentEthBps != null) setEthPct(bpsToPercent(currentEthBps));
  }, [currentEthBps]);

  useEffect(() => {
    if (currentArknBps != null) setArknPct(bpsToPercent(currentArknBps));
  }, [currentArknBps]);

  const parsePct = (val) => {
    const n = parseFloat(val);
    if (Number.isNaN(n) || n < MIN_PCT || n > MAX_PCT) return null;
    return Math.round(n * 100);
  };

  const handleUpdateEth = async () => {
    const bps = parsePct(ethPct);
    if (bps === null) {
      setError(`Enter a number between ${MIN_PCT} and ${MAX_PCT} for ETH rate`);
      return;
    }
    setError(null);
    setTxStatus("pending");
    try {
      const tx = await stakingContractWithSigner.setInterestRateBps(bps);
      await tx.wait();
      setTxStatus("success");
      onSuccess?.();
      setTimeout(() => setTxStatus(null), 3000);
    } catch (err) {
      setError(err.message || "Transaction failed");
      setTxStatus("error");
    }
  };

  const handleUpdateArkn = async () => {
    const bps = parsePct(arknPct);
    if (bps === null) {
      setError(`Enter a number between ${MIN_PCT} and ${MAX_PCT} for ARKN rate`);
      return;
    }
    setError(null);
    setTxStatus("pending");
    try {
      const tx = await stakingContractWithSigner.setArknInterestRateBps(bps);
      await tx.wait();
      setTxStatus("success");
      onSuccess?.();
      setTimeout(() => setTxStatus(null), 3000);
    } catch (err) {
      setError(err.message || "Transaction failed");
      setTxStatus("error");
    }
  };

  if (!stakingContractWithSigner) return null;

  return (
    <div className="rate-form">
      <p className="admin-card__muted" style={{ marginBottom: "12px" }}>
        Set APY between {MIN_PCT}% and {MAX_PCT}%. Changes are indexed by the subgraph and appear in Dashboard → Rate history.
      </p>
      {error && <div className="admin-alert admin-alert--error">{error}</div>}
      {txStatus === "success" && (
        <div className="admin-alert" style={{ background: "var(--success-bg)", color: "var(--success-text)" }}>
          Rate updated. Refreshing data…
        </div>
      )}
      {txStatus === "pending" && (
        <div className="admin-alert admin-alert--muted">Transaction pending…</div>
      )}

      <div className="rate-form__row">
        <label className="rate-form__label">
          ETH pool APY (%)
          <input
            type="text"
            className="input-text rate-form__input"
            value={ethPct}
            onChange={(e) => setEthPct(e.target.value)}
            placeholder="4.0"
            disabled={disabled}
          />
        </label>
        <button
          type="button"
          className="btn btn--primary"
          onClick={handleUpdateEth}
          disabled={disabled || txStatus === "pending"}
        >
          Update ETH rate
        </button>
      </div>

      <div className="rate-form__row">
        <label className="rate-form__label">
          ARKN pool APY (%)
          <input
            type="text"
            className="input-text rate-form__input"
            value={arknPct}
            onChange={(e) => setArknPct(e.target.value)}
            placeholder="4.0"
            disabled={disabled}
          />
        </label>
        <button
          type="button"
          className="btn btn--primary"
          onClick={handleUpdateArkn}
          disabled={disabled || txStatus === "pending"}
        >
          Update ARKN rate
        </button>
      </div>
    </div>
  );
}
