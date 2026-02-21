import { useState } from "react";

export default function ReceiveArknCard({ account }) {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (!account) return;
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card">
      <div className="card__header">
        <div className="card__icon">←</div>
        <div>
          <div className="card__title">Receive ARKN</div>
          <div className="card__subtitle">Your address to receive ARKN</div>
        </div>
      </div>

      <div className="receive-address-wrap">
        <code className="receive-address">{account || "0x…"}</code>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={copyAddress}
          disabled={!account}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
        Share this address to receive ARKN from another wallet or exchange.
      </p>
    </div>
  );
}
