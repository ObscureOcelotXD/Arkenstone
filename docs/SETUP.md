# Arkenstone — Setup & operations

Single reference for local development: Hardhat, Docker (Graph Node), subgraph, frontend, and admin. All commands assume you are at the **project root** unless noted.

---

## Overview

- **Hardhat** — Local chain (localhost:8545, chain ID 31337).
- **Contracts** — ArkenstoneStaking + ArkenstoneToken; deploy with `npm run deploy:local`.
- **Graph Node** (Docker) — Indexes the Hardhat chain; subgraph provides rate history and TVL/volume for the admin dashboard.
- **Frontend** — Staking UI at http://localhost:5173; connect wallet to 127.0.0.1:8545.
- **Admin** — Dashboard (TVL, rates, subgraph history) + Admin tab (owner rate updates) at http://localhost:5174.

---

## Prerequisites

- **Node 18+**
- **Docker** (Docker Desktop or `docker compose`) for the local Graph Node.
- **Graph CLI** (for subgraph): `npm install -g @graphprotocol/graph-cli` or use `npx` in `subgraph/`.

---

## Quick start

From project root:

```bash
npm run start:all
```

This starts (in order):

1. Hardhat node (`--hostname 0.0.0.0`)
2. Waits for RPC, then runs `deploy:local`, `sync-address`, and `sync-admin-env`
3. Docker (Graph Node, IPFS, Postgres)
4. Waits for Graph Node, then builds and deploys the subgraph to the local node
5. Frontend and admin dev servers in the background

**After a reboot or when things are out of sync (e.g. subgraph not seeing Hardhat changes):**

```bash
npm run start:all:restart
```

This:

- Kills processes on ports 8545, 5173, 5174
- Runs `docker compose down` and removes the `data/` folder (so the Graph Node indexes the **current** Hardhat chain from scratch)
- Then runs the same sequence as `start:all`, including subgraph deploy

**Stop everything:** From project root run `npm run stop:all` to kill Hardhat (8545), frontend (5173), admin (5174), and run `docker compose down`.

When the script finishes you get:

- **Hardhat:** http://127.0.0.1:8545  
- **Frontend:** http://localhost:5173 (wallet: 127.0.0.1:8545, chain 31337)  
- **Admin:** http://localhost:5174 (Dashboard + Admin tab)  
- **Graph Node:** http://127.0.0.1:8000 (subgraph already deployed)

---

## Ports

| Port  | Service           |
|-------|-------------------|
| 8545  | Hardhat node      |
| 5173  | Frontend (Vite)   |
| 5174  | Admin (Vite)      |
| 8000  | Graph Node HTTP   |
| 8020  | Graph Node admin  |
| 5001  | IPFS              |
| 5432  | Postgres (Docker) |

---

## Manual start (when you need steps separately)

1. **Hardhat** (terminal 1): `npx hardhat node --hostname 0.0.0.0` — leave running.
2. **Deploy** (terminal 2): `npm run deploy:local` — updates frontend addresses and admin `.env`.
3. **Sync subgraph address:** `node subgraph/scripts/sync-address.js`
4. **Docker:** `docker compose up` — leave running.
5. **Subgraph** (from `subgraph/`): `npm run codegen && npm run build:localhost && npm run create-local && npm run deploy-local` (use `--version-label v0.0.x` if you need non-interactive deploy).
6. **Frontend:** `cd frontend && npm run dev`
7. **Admin:** `cd admin && npm run dev`

---

## Local Graph Node & subgraph

The subgraph indexes **ArkenstoneStaking** on the Hardhat chain so the admin dashboard can show rate history and volume/TVL over time.

- **Create/deploy** (one-time or after wiping `data/`): from `subgraph/`, run `npm run create-local` then `npm run deploy-local`.
- **After contract or mapping changes:** from `subgraph/`, run `npm run codegen`, `npm run build:localhost`, then `npm run deploy-local` with a new version.

### Subgraph not seeing Hardhat changes?

- **Hardhat restarts = new chain.** Each `npx hardhat node` run creates a new chain. The Graph Node keeps indexing the old one. **Fix:** Use `npm run start:all:restart` (or stop Docker, `rm -rf data`, `docker compose up`, then from `subgraph/`: `npm run create-local` and `npm run deploy-local`).
- **Address mismatch.** After redeploying contracts, run `node subgraph/scripts/sync-address.js`, then in `subgraph/`: `npm run build:localhost` and `npm run deploy-local`. Confirm `subgraph/networks.json` and `frontend/src/contracts/addresses.js` use the same staking address.
- **Hardhat not reachable from Docker.** Start Hardhat with `--hostname 0.0.0.0`.
- **Logs:** `docker compose logs -f graph-node` to see indexing or RPC errors.

---

## Admin app

- **Run:** `cd admin && npm install && cp .env.example .env && npm run dev` — http://localhost:5174.
- **Env:** `sync-admin-env.js` (run by `deploy:local` / `start:all`) sets `VITE_STAKING_ADDRESS`, `VITE_RPC_URL`, and (if missing) `VITE_SUBGRAPH_URL` to the local proxy URL so the dashboard can query the subgraph without CORS.

| Variable              | Description |
|-----------------------|-------------|
| `VITE_RPC_URL`        | RPC (default `http://127.0.0.1:8545`) |
| `VITE_STAKING_ADDRESS`| Staking contract (set by sync script) |
| `VITE_SUBGRAPH_URL`   | Subgraph HTTP URL (local: `http://localhost:5174/subgraphs/name/arkenstone/arkenstone`) |

**Dashboard:** TVL and interest rates from chain; rate history and volume from the subgraph when `VITE_SUBGRAPH_URL` is set. **Admin tab:** Wallet connect + owner-only interest rate form.

---

## Subgraph (schema, sync, deploy)

- **Sync address after deploy:** from repo root, `node subgraph/scripts/sync-address.js` (writes `subgraph.yaml` and `networks.json` from `ignition/deployments/chain-31337/`).
- **Build** (from `subgraph/`): `npm run codegen` then `npm run build:localhost`.
- **Entities:** `Protocol` (singleton), `InterestRateChange`, `EthDeposit`/`EthWithdraw`, `ArknDeposit`/`ArknWithdraw`, `TvlSnapshot`.

### Deploy to Sepolia / Hosted Service

1. Deploy contracts: `npm run deploy:sepolia` (set `.env` with `SEPOLIA_RPC_URL`, `PRIVATE_KEY`).
2. Sync subgraph: `CHAIN_ID=11155111 node subgraph/scripts/sync-address.js`.
3. In `subgraph.yaml` set `network: sepolia` and optionally `source.startBlock`.
4. From `subgraph/`: `graph codegen`, `graph build`, then `graph auth` and `graph deploy` (Studio or Hosted Service).
5. Put the subgraph’s Query URL in `admin/.env` as `VITE_SUBGRAPH_URL`.

---

## GraphQL queries (subgraph)

With the local Graph Node running, you can use GraphiQL at `http://127.0.0.1:8000/subgraphs/name/arkenstone/arkenstone`. Example queries:

**Protocol (TVL and rates):**

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

**Rate history:**

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

**Recent ETH deposits:**

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

More examples and TVL snapshots: see `docs/GRAPHQL_QUERIES.md`.

---

## Contract & events (for subgraph)

**ArkenstoneStaking** — on-chain: `interestRateBps()`, `arknInterestRateBps()`, `getTVL()`, `totalEthStaked()`, `totalArknStaked()`. Events indexed by the subgraph: `Deposited`, `Withdrawn`, `InterestRateUpdated`, `ArknDeposited`, `ArknWithdrawn`, `ArknInterestRateUpdated` (and rewards if needed). See `docs/THE_GRAPH.md` for full event list and suggested entities.

---

## Admin app and The Graph

The admin app is a **client** of the subgraph: it only needs the subgraph **HTTP URL** (`VITE_SUBGRAPH_URL`). It does not build or deploy the subgraph. The Graph Hardhat plugin is optional (for generating/deploying the subgraph from this repo). Queries in `admin/src/lib/subgraph.js` must match the deployed subgraph schema (`protocol`, `interestRateChanges`, etc.). See `docs/ADMIN_GRAPH_SETUP.md` for details.

---

## Troubleshooting

- **Admin shows "could not decode result data" or 0 TVL:** Admin is using an old staking address. Run `node scripts/sync-admin-env.js` (or `start:all`, which runs it), then refresh the admin page.
- **Admin "NetworkError" when fetching subgraph:** Ensure Graph Node is running and subgraph is deployed; or leave `VITE_SUBGRAPH_URL` unset if you are not using the subgraph.
- **Subgraph not updating:** Use `start:all:restart` so the Graph Node wipes `data/` and re-indexes the current Hardhat chain; or manually `docker compose down`, `rm -rf data`, `docker compose up`, then from `subgraph/` run `create-local` and `deploy-local`.

---

## Tests

From project root:

```bash
npm test
```

This runs **Hardhat contract tests** (ArkenstoneStaking, ArkenstoneToken, AssetReceiver, AssetWithdrawler, Lock) and **script unit tests** for `sync-admin-env` and `sync-address` (subgraph). Script tests use temp directories and do not modify your real `admin/.env` or `subgraph/subgraph.yaml`.

- **Contract tests** — `test/ArkenstoneStaking.test.js`, `test/ArkenstoneToken.test.js`, etc. Deploy token + staking in-process and assert deployment, ETH/ARKN staking, rewards, owner rate updates, TVL, and edge cases (non-depositor stake info, multiple depositors).
- **Script tests** — `test/scripts/sync-admin-env.test.js`, `test/scripts/sync-address.test.js`. Test that `syncAdminEnv(root)` and `syncSubgraphAddress(subgraphDir, deploymentsPath, chainId)` write the expected env and YAML/networks.json from fixture deployment files.

---

## Cheatsheet

| Goal                         | Command |
|-----------------------------|--------|
| Start full stack             | `npm run start:all` |
| Full restart (ports + Docker + data) | `npm run start:all:restart` |
| Stop full stack              | `npm run stop:all` |
| Deploy contracts only        | `npm run deploy:local` |
| Sync subgraph address       | `node subgraph/scripts/sync-address.js` |
| Sync admin .env             | `node scripts/sync-admin-env.js` |
| Subgraph build + deploy      | `cd subgraph && npm run codegen && npm run build:localhost && npm run deploy-local` |
| Stop Docker                  | `docker compose down` |
| Graph Node logs              | `docker compose logs -f graph-node` |

---

## Other docs

- **GRAPHQL_QUERIES.md** — Full GraphiQL examples (TVL snapshots, ARKN activity, etc.).
- **THE_GRAPH.md** — Contract events and suggested subgraph entities.
- **ADMIN_GRAPH_SETUP.md** — What the admin needs from the subgraph (URL, schema alignment).
- **CHEATSHEET.md** — Short reference (largely folded into this file).
