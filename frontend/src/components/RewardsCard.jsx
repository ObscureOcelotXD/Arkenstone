import { ethers } from "ethers";

function fmtArkn(wei) {
  if (wei === 0n) return "0.0000";
  const val = parseFloat(ethers.formatEther(wei));
  return val < 0.0001 ? "< 0.0001" : val.toFixed(4);
}

export default function RewardsCard({
  pendingRewards,
  pendingArknRewards,
  onClaimAll,
  loading,
}) {
  const fromEth = pendingRewards ?? 0n;
  const fromArkn = pendingArknRewards ?? 0n;
  const total = fromEth + fromArkn;
  const hasRewards = total > 0n;

  return (
    <div className="card">
      <div className="card__header">
        <div className="card__icon">◆</div>
        <div>
          <div className="card__title">ARKN Rewards</div>
          <div className="card__subtitle">From ETH stake + ARKN stake</div>
        </div>
      </div>

      <div className="rewards-breakdown">
        <div>
          <span className="rewards-label">From ETH stake</span>
          <span className="rewards-value rewards-value--sm">{fmtArkn(fromEth)}</span>
        </div>
        <div>
          <span className="rewards-label">From ARKN stake</span>
          <span className="rewards-value rewards-value--sm">{fmtArkn(fromArkn)}</span>
        </div>
      </div>
      <div>
        <div className="rewards-value">{fmtArkn(total)}</div>
        <div className="rewards-unit">ARKN available to claim</div>
      </div>

      <button
        className="btn btn--primary btn--full"
        onClick={onClaimAll}
        disabled={loading || !hasRewards}
      >
        {loading ? "Processing…" : "Claim all ARKN"}
      </button>

      <div className="rewards-note">
        Rewards from both pools are minted to your wallet. Rate details TBD.
      </div>
    </div>
  );
}
