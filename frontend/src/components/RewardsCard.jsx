import { ethers } from "ethers";

function fmtArkn(wei) {
  if (wei === 0n) return "0.0000";
  const val = parseFloat(ethers.formatEther(wei));
  return val < 0.0001 ? "< 0.0001" : val.toFixed(4);
}

function ApyBadge({ percent, assetName, tooltipBody }) {
  if (percent == null) return null;
  const label = `${percent}% APY`;
  return (
    <span className="rewards-apy-wrap">
      <span className="rewards-apy-badge">{label}</span>
      <span className="rewards-apy-trigger" aria-label="APY details">
        <span className="rewards-apy-trigger-icon">ⓘ</span>
        <span className="rewards-apy-popup" role="tooltip">
          <strong>{assetName} stake</strong> — {tooltipBody}
        </span>
      </span>
    </span>
  );
}

export default function RewardsCard({
  pendingRewards,
  pendingArknRewards,
  onClaimAll,
  loading,
  ethApyPercent = null,
  arknApyPercent = null,
}) {
  const fromEth = pendingRewards ?? 0n;
  const fromArkn = pendingArknRewards ?? 0n;
  const total = fromEth + fromArkn;
  const hasRewards = total > 0n;
  const hasRates = ethApyPercent != null || arknApyPercent != null;
  const subtitle = hasRates
    ? [ethApyPercent != null && `ETH ${ethApyPercent}% APY`, arknApyPercent != null && `ARKN ${arknApyPercent}% APY`].filter(Boolean).join(" · ")
    : "From ETH stake + ARKN stake";

  return (
    <div className="card">
      <div className="card__header">
        <div className="card__icon">◆</div>
        <div>
          <div className="card__title">ARKN Rewards</div>
          <div className="card__subtitle">
            {hasRates ? `Earning ${subtitle}` : subtitle}
          </div>
        </div>
      </div>

      <table className="rewards-table">
        <thead>
          <tr>
            <th className="rewards-table__source">Source</th>
            <th className="rewards-table__apy">APY</th>
            <th className="rewards-table__pending">Pending</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="rewards-table__source">From ETH stake</td>
            <td className="rewards-table__apy">
              <ApyBadge
                percent={ethApyPercent}
                assetName="ETH"
                tooltipBody="Rewards are paid in ARKN at this annual rate. Interest accrues every block and compounds when you claim."
              />
            </td>
            <td className="rewards-table__pending rewards-value rewards-value--sm">{fmtArkn(fromEth)}</td>
          </tr>
          <tr>
            <td className="rewards-table__source">From ARKN stake</td>
            <td className="rewards-table__apy">
              <ApyBadge
                percent={arknApyPercent}
                assetName="ARKN"
                tooltipBody="Staked ARKN earns more ARKN at this annual rate. Rewards accrue every block and compound when you claim."
              />
            </td>
            <td className="rewards-table__pending rewards-value rewards-value--sm">{fmtArkn(fromArkn)}</td>
          </tr>
        </tbody>
      </table>
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
        Rewards from both pools are minted to your wallet when you claim.
      </div>
    </div>
  );
}
