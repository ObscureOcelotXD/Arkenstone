import { ethers } from "ethers";
import { useStakingData } from "../hooks/useStakingData.js";
import { useSubgraphData } from "../hooks/useSubgraphData.js";

function formatEth(wei) {
  if (wei === 0n) return "0";
  return ethers.formatEther(wei);
}

function formatArkn(wei) {
  if (wei === 0n) return "0";
  const n = Number(ethers.formatEther(wei));
  return n < 0.0001 ? "< 0.0001" : n.toFixed(4);
}

function bpsToPercent(bps) {
  if (bps == null) return "—";
  return (Number(bps) / 100).toFixed(1);
}

export default function Dashboard({ staking, subgraph }) {
  const { data, loading: stakingLoading, error: stakingError } = staking;
  const { rateHistory, volumeOrTvl, loading: subgraphLoading, error: subgraphError, configured: subgraphConfigured } = subgraph;

  return (
    <div className="dashboard">
      <h2 className="dashboard__heading">Chain & DeFi data</h2>
      <p className="dashboard__sub">TVL and interest rates from chain; volume and history from The Graph when configured.</p>

      {/* TVL — from contract */}
      <section className="admin-card">
        <h3 className="admin-card__title">TVL (Total Value Locked)</h3>
        <p className="admin-card__source">Live from staking contract</p>
        {stakingLoading && <p className="admin-card__loading">Loading…</p>}
        {stakingError && <p className="admin-card__error">{stakingError}</p>}
        {!stakingLoading && !stakingError && (
          <div className="admin-card__grid">
            <div className="admin-stat">
              <span className="admin-stat__label">ETH staked</span>
              <span className="admin-stat__value admin-stat__value--gold">{formatEth(data.totalEthStaked)} ETH</span>
            </div>
            <div className="admin-stat">
              <span className="admin-stat__label">ARKN staked</span>
              <span className="admin-stat__value admin-stat__value--gold">{formatArkn(data.totalArknStaked)} ARKN</span>
            </div>
          </div>
        )}
      </section>

      {/* Interest rates — from contract + optional history from subgraph */}
      <section className="admin-card">
        <h3 className="admin-card__title">Interest rates</h3>
        <p className="admin-card__source">Current from contract; history from The Graph when configured</p>
        {stakingLoading && <p className="admin-card__loading">Loading…</p>}
        {stakingError && <p className="admin-card__error">{stakingError}</p>}
        {!stakingLoading && !stakingError && (
          <>
            <div className="admin-card__grid">
              <div className="admin-stat">
                <span className="admin-stat__label">ETH pool APY</span>
                <span className="admin-stat__value">{bpsToPercent(data.interestRateBps)}%</span>
              </div>
              <div className="admin-stat">
                <span className="admin-stat__label">ARKN pool APY</span>
                <span className="admin-stat__value">{bpsToPercent(data.arknInterestRateBps)}%</span>
              </div>
            </div>
            {subgraphConfigured && (
              <div className="admin-card__section">
                <h4 className="admin-card__subtitle">Rate history (from subgraph)</h4>
                {subgraphLoading && <p className="admin-card__loading">Loading history…</p>}
                {subgraphError && <p className="admin-card__error admin-card__error--sm">{subgraphError}</p>}
                {!subgraphLoading && rateHistory?.length > 0 && (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Pool</th>
                        <th>Old</th>
                        <th>New</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rateHistory.map((r) => (
                        <tr key={r.id}>
                          <td>{r.timestamp ? new Date(Number(r.timestamp) * 1000).toLocaleString() : "—"}</td>
                          <td>{r.pool ?? "—"}</td>
                          <td>{(Number(r.oldBps) / 100).toFixed(1)}%</td>
                          <td>{(Number(r.newBps) / 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {!subgraphLoading && !subgraphError && rateHistory?.length === 0 && (
                  <p className="admin-card__muted">No rate history yet. Deploy a subgraph that indexes InterestRateUpdated / ArknInterestRateUpdated.</p>
                )}
              </div>
            )}
            {!subgraphConfigured && (
              <p className="admin-card__muted">Set VITE_SUBGRAPH_URL to show rate history from The Graph.</p>
            )}
          </>
        )}
      </section>

      {/* Volume / activity — from The Graph */}
      <section className="admin-card">
        <h3 className="admin-card__title">Trading / staking volume</h3>
        <p className="admin-card__source">From The Graph (deposits & withdrawals over time)</p>
        {!subgraphConfigured && (
          <p className="admin-card__muted">Set VITE_SUBGRAPH_URL in .env to load volume and TVL-over-time from your subgraph.</p>
        )}
        {subgraphConfigured && subgraphLoading && <p className="admin-card__loading">Loading…</p>}
        {subgraphConfigured && subgraphError && <p className="admin-card__error">{subgraphError}</p>}
        {subgraphConfigured && !subgraphLoading && !subgraphError && volumeOrTvl?.length > 0 && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>ETH staked</th>
                <th>ARKN staked</th>
                <th>Deposit vol</th>
                <th>Withdraw vol</th>
              </tr>
            </thead>
            <tbody>
              {volumeOrTvl.map((s) => (
                <tr key={s.id}>
                  <td>{s.timestamp ? new Date(Number(s.timestamp) * 1000).toLocaleDateString() : "—"}</td>
                  <td>{s.totalEthStaked != null ? formatEth(BigInt(s.totalEthStaked)) : "—"}</td>
                  <td>{s.totalArknStaked != null ? formatArkn(BigInt(s.totalArknStaked)) : "—"}</td>
                  <td>{s.depositVolume != null ? formatEth(BigInt(s.depositVolume)) : "—"}</td>
                  <td>{s.withdrawVolume != null ? formatEth(BigInt(s.withdrawVolume)) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {subgraphConfigured && !subgraphLoading && !subgraphError && (!volumeOrTvl || volumeOrTvl.length === 0) && (
          <p className="admin-card__muted">No volume snapshots yet. Add dailySnapshots (or similar) to your subgraph schema.</p>
        )}
      </section>
    </div>
  );
}
