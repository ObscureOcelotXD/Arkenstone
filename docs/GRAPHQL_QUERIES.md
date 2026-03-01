# GraphiQL — example queries for the Arkenstone subgraph

**Main setup:** [SETUP.md](./SETUP.md) — quick start and subgraph deploy.

---

When the local Graph Node is running, open **GraphiQL** in your browser (e.g. the link from the Graph Node or `http://127.0.0.1:8000/subgraphs/name/arkenstone/arkenstone`). You can run these queries there.

---

## What’s already built

- **Subgraph** (`subgraph/schema.graphql` + `subgraph/src/mapping.ts`) indexes your staking contract and exposes:
  - **Protocol** (singleton) — current TVL and interest rates
  - **InterestRateChange** — each time ETH or ARKN rate was updated
  - **EthDeposit** / **EthWithdraw** — ETH stake/unstake events
  - **ArknDeposit** / **ArknWithdraw** — ARKN stake/unstake events

- **Admin app** (`admin/src/lib/subgraph.js`) already uses `interestRateChanges` and `protocol` (and a placeholder for volume). The dashboard “The Graph” section runs those for you.

GraphiQL lets you run the same (or any) queries by hand and explore the schema.

---

## Example queries (paste into GraphiQL)

### Current TVL and rates (singleton)

```graphql
query Protocol {
  protocol(id: "global") {
    totalEthStaked
    totalArknStaked
    currentInterestRateBps
    currentArknInterestRateBps
    updatedAtBlock
    updatedAtTimestamp
  }
}
```

### Interest rate history (last 20 changes)

```graphql
query RateHistory {
  interestRateChanges(first: 20, orderBy: timestamp, orderDirection: desc) {
    id
    pool
    oldBps
    newBps
    blockNumber
    timestamp
    transactionHash
  }
}
```

### Recent ETH deposits

```graphql
query RecentEthDeposits {
  ethDeposits(first: 10, orderBy: timestamp, orderDirection: desc) {
    id
    user
    amount
    blockNumber
    timestamp
    transactionHash
  }
}
```

### Recent ETH withdraws

```graphql
query RecentEthWithdraws {
  ethWithdraws(first: 10, orderBy: timestamp, orderDirection: desc) {
    id
    user
    amount
    blockNumber
    timestamp
    transactionHash
  }
}
```

### TVL over time (snapshots at each deposit/withdraw)

```graphql
query TvlOverTime {
  tvlSnapshots(first: 20, orderBy: timestamp, orderDirection: desc) {
    id
    totalEthStaked
    totalArknStaked
    timestamp
  }
}
```

### Recent ARKN deposits / withdraws

```graphql
query RecentArknActivity {
  arknDeposits(first: 5, orderBy: timestamp, orderDirection: desc) {
    id
    user
    amount
    timestamp
  }
  arknWithdraws(first: 5, orderBy: timestamp, orderDirection: desc) {
    id
    user
    amount
    timestamp
  }
}
```

---

## What you can do in GraphiQL

- **Docs** — Open the “Docs” panel to see all types and fields.
- **Run queries** — Paste a query, click Play (or Cmd+Enter), see the result.
- **Try variables** — Use the “Query Variables” panel, e.g. `{ "first": 5 }` for queries that take `$first`.
- **Inspect** — See exactly what the admin dashboard is requesting; tweak fields or filters for your own use.

The admin dashboard uses the same `protocol` and `interestRateChanges` queries under the hood; GraphiQL is the same API with a UI to explore and experiment.
