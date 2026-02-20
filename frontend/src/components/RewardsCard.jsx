import { ethers } from "ethers";

function fmtArkn(wei) {
  if (wei === 0n) return "0.0000";
  const val = parseFloat(ethers.formatEther(wei));
  return val < 0.0001 ? "< 0.0001" : val.toFixed(4);
}

export default function RewardsCard({ pendingRewards, onClaim, loading }) {
  const hasRewards = pendingRewards > 0n;

  return (
    <div className="card">
      <div className="card__header">
        <div className="card__icon">◆</div>
        <div>
          <div className="card__title">ARKN Rewards</div>
          <div className="card__subtitle">Accruing in real time</div>
        </div>
      </div>

      <div>
        <div className="rewards-value">{fmtArkn(pendingRewards)}</div>
        <div className="rewards-unit">ARKN available to claim</div>
      </div>

      <button
        className="btn btn--primary btn--full"
        onClick={onClaim}
        disabled={loading || !hasRewards}
      >
        {loading ? "Processing…" : "Claim ARKN"}
      </button>

      <div className="rewards-note">
        ~100 ARKN per ETH per day. Rewards are minted directly to your wallet.
      </div>
    </div>
  );
}
