import { ethers } from "ethers";

function fmt(wei, decimals = 4) {
  if (wei === 0n) return "0";
  const val = parseFloat(ethers.formatEther(wei));
  return val < 0.0001 ? "< 0.0001" : val.toFixed(decimals);
}

export default function StatsRow({ stakedAmount, pendingRewards, arknBalance, arknSupply }) {
  return (
    <div className="stats-row">
      <div className="stat-card">
        <div className="stat-card__label">ETH Staked</div>
        <div className="stat-card__value">{fmt(stakedAmount, 4)}</div>
        <div className="stat-card__unit">ETH</div>
      </div>

      <div className="stat-card">
        <div className="stat-card__label">Pending Rewards</div>
        <div className="stat-card__value stat-card__value--gold">{fmt(pendingRewards, 4)}</div>
        <div className="stat-card__unit">ARKN</div>
      </div>

      <div className="stat-card">
        <div className="stat-card__label">ARKN Balance</div>
        <div className="stat-card__value stat-card__value--gold">{fmt(arknBalance, 4)}</div>
        <div className="stat-card__unit">ARKN in wallet</div>
      </div>

      <div className="stat-card">
        <div className="stat-card__label">Total ARKN Supply</div>
        <div className="stat-card__value">{fmt(arknSupply, 2)}</div>
        <div className="stat-card__unit">ARKN minted</div>
      </div>
    </div>
  );
}
