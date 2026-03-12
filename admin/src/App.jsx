import { useState, useCallback } from "react";
import { useStakingData } from "./hooks/useStakingData.js";
import { useSubgraphData } from "./hooks/useSubgraphData.js";
import { useWallet } from "./hooks/useWallet.js";
import { useBlockRefresh } from "./hooks/useBlockRefresh.js";
import InterestRateForm from "./components/InterestRateForm.jsx";
import { ethers } from "ethers";
import { RPC_URL } from "./config/contracts.js";
import "./App.css";

function formatEth(wei) {
  if (wei === 0n) return "0";
  return ethers.formatEther(wei);
}

function formatArkn(wei) {
  if (wei === 0n) return "0";
  const v = parseFloat(ethers.formatEther(wei));
  return v < 0.0001 ? "< 0.0001" : v.toFixed(4);
}

function bpsToPercent(bps) {
  if (bps == null) return "—";
  return (Number(bps) / 100).toFixed(1);
}

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const { data: staking, loading: stakingLoading, error: stakingError, refetch: refetchStaking } = useStakingData();
  const { rateHistory, volumeOrTvl, loading: graphLoading, error: graphError, configured: graphConfigured, refetch: refetchSubgraph } = useSubgraphData();
  const { account, connect, disconnect, stakingContractWithSigner, isRightChain, isConnected, error: walletError } = useWallet();
  const blockInfo = useBlockRefresh(RPC_URL, useCallback(() => {
    refetchStaking();
    refetchSubgraph();
  }, [refetchStaking, refetchSubgraph]));

  const onRateUpdateSuccess = useCallback(() => {
    refetchStaking();
    setTimeout(() => refetchSubgraph(), 2500);
  }, [refetchStaking, refetchSubgraph]);

  return (
    <div className="admin-app">
      <header className="admin-header">
        <div className="admin-header__inner">
          <h1 className="admin-header__title">◆ Arkenstone Admin</h1>
          <div className="admin-header__wallet">
            {isConnected ? (
              <>
                <span className="admin-header__account">{account?.slice(0, 6)}…{account?.slice(-4)}</span>
                {!isRightChain && <span className="admin-header__badge">Wrong network</span>}
                <button type="button" className="btn btn--ghost btn--sm" onClick={disconnect}>Disconnect</button>
              </>
            ) : (
              <button type="button" className="btn btn--primary btn--sm" onClick={connect}>Connect wallet</button>
            )}
          </div>
          <nav className="admin-nav">
            <button
              className={`admin-nav__btn ${tab === "dashboard" ? "admin-nav__btn--active" : ""}`}
              onClick={() => setTab("dashboard")}
            >
              Dashboard
            </button>
            <button
              className={`admin-nav__btn ${tab === "admin" ? "admin-nav__btn--active" : ""}`}
              onClick={() => setTab("admin")}
            >
              Admin
            </button>
          </nav>
        </div>
      </header>

      <main className="admin-main">
        {tab === "dashboard" && (
          <div className="dashboard">
            <section className="dashboard-section">
              <h2 className="dashboard-section__title">Block info</h2>
              <p className="dashboard-section__sub">Chain state — updates on new blocks (throttled 3s)</p>
              {blockInfo.loading ? (
                <div className="admin-card admin-card--loading">Loading block info…</div>
              ) : (
                <div className="admin-cards">
                  <div className="admin-card">
                    <div className="admin-card__label">Block number</div>
                    <div className="admin-card__value">
                      {blockInfo.blockNumber != null ? blockInfo.blockNumber.toLocaleString() : "—"}
                    </div>
                  </div>
                  <div className="admin-card">
                    <div className="admin-card__label">Block timestamp</div>
                    <div className="admin-card__value">
                      {blockInfo.blockTimestamp != null
                        ? new Date(Number(blockInfo.blockTimestamp) * 1000).toLocaleString()
                        : "—"}
                    </div>
                  </div>
                  <div className="admin-card">
                    <div className="admin-card__label">Chain ID</div>
                    <div className="admin-card__value">{blockInfo.chainId ?? "—"}</div>
                  </div>
                </div>
              )}
            </section>

            <section className="dashboard-section">
              <h2 className="dashboard-section__title">ARKN</h2>
              <p className="dashboard-section__sub">Total supply, staked, and unclaimed rewards</p>
              {stakingLoading ? (
                <div className="admin-card admin-card--loading">Loading…</div>
              ) : (
                <div className="admin-cards">
                  <div className="admin-card">
                    <div className="admin-card__label">Total ARKN supply (minted)</div>
                    <div className="admin-card__value admin-card__value--gold">
                      {formatArkn(staking.totalArknSupply ?? 0n)} ARKN
                    </div>
                  </div>
                  <div className="admin-card">
                    <div className="admin-card__label">Total ARKN staked</div>
                    <div className="admin-card__value admin-card__value--gold">
                      {formatArkn(staking.totalArknStaked ?? 0n)} ARKN
                    </div>
                  </div>
                  <div className="admin-card">
                    <div className="admin-card__label">Pending (unclaimed) ARKN rewards</div>
                    <div className="admin-card__value">—</div>
                    <div className="admin-card__muted" style={{ marginTop: "4px", fontSize: "0.85em" }}>
                      Not tracked on-chain (would require a contract view over all stakers).
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="dashboard-section">
              <h2 className="dashboard-section__title">TVL (DeFi)</h2>
              <p className="dashboard-section__sub">Total value locked — from chain</p>
              {stakingError && (
                <div className="admin-alert admin-alert--error">{stakingError}</div>
              )}
              {stakingLoading ? (
                <div className="admin-card admin-card--loading">Loading…</div>
              ) : (
                <div className="admin-cards">
                  <div className="admin-card">
                    <div className="admin-card__label">ETH staked</div>
                    <div className="admin-card__value admin-card__value--gold">
                      {formatEth(staking.totalEthStaked)} ETH
                    </div>
                  </div>
                  <div className="admin-card">
                    <div className="admin-card__label">ARKN staked</div>
                    <div className="admin-card__value admin-card__value--gold">
                      {formatArkn(staking.totalArknStaked)} ARKN
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="dashboard-section">
              <h2 className="dashboard-section__title">Interest rates</h2>
              <p className="dashboard-section__sub">Current APY — from chain</p>
              {stakingLoading ? (
                <div className="admin-card admin-card--loading">Loading…</div>
              ) : (
                <div className="admin-cards">
                  <div className="admin-card">
                    <div className="admin-card__label">ETH pool</div>
                    <div className="admin-card__value admin-card__value--gold">
                      {bpsToPercent(staking.interestRateBps)}% APY
                    </div>
                  </div>
                  <div className="admin-card">
                    <div className="admin-card__label">ARKN pool</div>
                    <div className="admin-card__value admin-card__value--gold">
                      {bpsToPercent(staking.arknInterestRateBps)}% APY
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="dashboard-section">
              <h2 className="dashboard-section__title">The Graph</h2>
              <p className="dashboard-section__sub">
                Rate history, trading volume, TVL over time — from subgraph
              </p>
              {!graphConfigured && (
                <div className="admin-alert admin-alert--muted">
                  Set <code>VITE_SUBGRAPH_URL</code> in <code>.env</code> to show rate history and volume from your subgraph.
                </div>
              )}
              {graphConfigured && graphError && (
                <div className="admin-alert admin-alert--error">
                  {graphError}
                  {(graphError.includes("fetch") || graphError.includes("Network")) && (
                    <div style={{ marginTop: "8px", fontSize: "0.85em" }}>
                      Ensure Docker is running and the subgraph is deployed:{" "}
                      <code>cd subgraph && npm run create-local && npm run deploy-local</code>. If you just started the stack, wait ~30s and refresh.
                    </div>
                  )}
                </div>
              )}
              {graphConfigured && !graphError && (
                <>
                  {graphLoading ? (
                    <div className="admin-card admin-card--loading">Loading subgraph…</div>
                  ) : (
                    <div className="admin-cards admin-cards--stack">
                      <div className="admin-card">
                        <div className="admin-card__label">Rate history</div>
                        {rateHistory.length === 0 ? (
                          <div className="admin-card__muted">
                            No rate changes yet, or subgraph schema differs. Deploy a subgraph that indexes <code>InterestRateUpdated</code> / <code>ArknInterestRateUpdated</code>.
                          </div>
                        ) : (
                          <ul className="admin-list">
                            {rateHistory.slice(0, 10).map((r) => (
                              <li key={r.id}>
                                {r.pool} {Number(r.oldBps) / 100}% → {Number(r.newBps) / 100}%
                                {r.timestamp && (
                                  <span className="admin-list__meta">
                                    {new Date(Number(r.timestamp) * 1000).toLocaleString()}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="admin-card">
                        <div className="admin-card__label">Volume / TVL over time</div>
                        {volumeOrTvl.length === 0 ? (
                          <div className="admin-card__muted">
                            No TVL snapshots yet. Each deposit or withdraw on the staking contract is indexed as a snapshot; do some stakes to see history here.
                          </div>
                        ) : (
                          <ul className="admin-list">
                            {volumeOrTvl.slice(0, 10).map((s) => (
                              <li key={s.id}>
                                ETH: {formatEth(s.totalEthStaked ?? 0)} · ARKN: {formatArkn(s.totalArknStaked ?? 0)}
                                {s.timestamp && (
                                  <span className="admin-list__meta">
                                    {new Date(Number(s.timestamp) * 1000).toLocaleDateString()}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        )}

        {tab === "admin" && (
          <div className="dashboard">
            <section className="dashboard-section">
              <h2 className="dashboard-section__title">Interest rates</h2>
              <p className="dashboard-section__sub">Update ETH and ARKN pool APY (owner only). Changes appear in Dashboard → Rate history.</p>
              {walletError && <div className="admin-alert admin-alert--error">{walletError}</div>}
              {!isConnected ? (
                <div className="admin-card">
                  <p className="admin-card__muted">Connect a wallet that is the staking contract owner to change rates.</p>
                  <button type="button" className="btn btn--primary" onClick={connect} style={{ marginTop: "12px" }}>
                    Connect wallet
                  </button>
                </div>
              ) : !isRightChain ? (
                <div className="admin-alert admin-alert--error">
                  Switch your wallet to the correct network (chain ID 31337 for local Hardhat).
                </div>
              ) : (
                <div className="admin-card">
                  <InterestRateForm
                    stakingContractWithSigner={stakingContractWithSigner}
                    currentEthBps={staking?.interestRateBps ?? null}
                    currentArknBps={staking?.arknInterestRateBps ?? null}
                    onSuccess={onRateUpdateSuccess}
                    disabled={stakingLoading}
                  />
                </div>
              )}
            </section>
            <section className="dashboard-section">
              <h2 className="dashboard-section__title">Other admin</h2>
              <p className="dashboard-section__sub">Coming later</p>
              <div className="admin-card">
                <p className="admin-card__muted">ERC‑20 eligibility (add/remove tokens) — TBD.</p>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
