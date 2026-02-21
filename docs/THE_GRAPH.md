# The Graph — Arkenstone Staking

This app is ready to be indexed by The Graph (e.g. via Docker) so an admin portal can read **interest rates**, **TVL**, and history.

## Contract: ArkenstoneStaking

### On-chain data (no subgraph required)

- **Interest rates (basis points)**  
  - `interestRateBps()` — ETH pool (default 400 = 4%)  
  - `arknInterestRateBps()` — ARKN pool (default 400 = 4%)  
  - Clamp: 100 (1%) to 1000 (10%). Set by admin via `setInterestRateBps(uint256)` / `setArknInterestRateBps(uint256)`.

- **TVL**  
  - `getTVL()` → `(totalEthStaked, totalArknStaked)` in wei  
  - `totalEthStaked()`  
  - `totalArknStaked()`

### Events to index (for subgraph)

| Event                     | Use case                          |
|---------------------------|-----------------------------------|
| `Deposited(user, amount)` | ETH stake history, TVL over time  |
| `Withdrawn(user, amount)` | ETH unstake history, TVL         |
| `RewardsClaimed(user, amount)` | Reward payouts               |
| `InterestRateUpdated(oldBps, newBps)` | Rate history, admin audit  |
| `ArknDeposited(user, amount)` | ARKN stake history, TVL    |
| `ArknWithdrawn(user, amount)` | ARKN unstake history        |
| `ArknRewardsClaimed(user, amount)` | ARKN reward payouts      |
| `ArknInterestRateUpdated(oldBps, newBps)` | ARKN rate history   |

### Suggested subgraph entities (for admin portal)

- **Global**  
  - `totalEthStaked`, `totalArknStaked` (or derive from events)  
  - `currentInterestRateBps`, `currentArknInterestRateBps` (from latest `InterestRateUpdated` / `ArknInterestRateUpdated`)

- **Rate history**  
  - `InterestRateChange`: timestamp, oldBps, newBps (ETH and ARKN pools)

- **Stakes / TVL over time**  
  - Aggregate `Deposited` / `Withdrawn` and `ArknDeposited` / `ArknWithdrawn` to compute TVL at any block.

Your admin portal can call the contract directly for current rate and TVL, or query the subgraph for history and analytics.
