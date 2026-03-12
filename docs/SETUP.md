# Arkenstone — Setup & operations

Single reference for local development: Hardhat, Docker (Graph Node), subgraph, frontend, and admin. All commands assume you are at the **project root** unless noted.

**Secrets:** This project uses [Infisical](https://infisical.com) (free tier) for secrets. You run the stack with `npm run start:all:infisical` so Infisical injects `GRAPH_POSTGRES_PASSWORD`, `VITE_*`, etc. You do **not** need a `.env` file; you can leave it empty or delete it. See [docs/INFISICAL.md](INFISICAL.md). (Optional fallback: use a root `.env` and `npm run start:all` without Infisical.)

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
- **Infisical** — CLI installed (`brew install infisical/get-cli/infisical` or `npm i -g @infisical/cli`), logged in (`infisical login`), and project linked (`infisical init`). Add secrets (e.g. `GRAPH_POSTGRES_PASSWORD`, `VITE_RPC_URL`, `VITE_SUBGRAPH_URL`) in the Infisical dashboard. See [docs/INFISICAL.md](INFISICAL.md).
- **Docker** (Docker Desktop or `docker compose`) for the local Graph Node.
- **Graph CLI** (for subgraph): `npm install -g @graphprotocol/graph-cli` or use `npx` in `subgraph/`.

---

## Quick start

From project root (requires [Infisical](INFISICAL.md) set up: `infisical login`, `infisical init`, and secrets added in the dashboard):

```bash
npm run start:all:infisical
```

This injects secrets from Infisical and starts (in order):

1. Hardhat node (`--hostname 0.0.0.0`)
2. Waits for RPC, then runs `deploy:local`, `sync-address`, and `sync-admin-env`
3. Docker (Graph Node, IPFS, Postgres) — uses `GRAPH_POSTGRES_PASSWORD` from Infisical
4. Waits for Graph Node, then builds and deploys the subgraph to the local node
5. Frontend and admin dev servers (admin gets `VITE_*` from Infisical)

**After a reboot or when the subgraph isn’t connected / not seeing Hardhat changes:**

```bash
npm run start:all:restart:infisical
```

This kills processes on 8545, 5173, 5174; runs `docker compose down` and removes `data/` so the Graph Node re-indexes the current Hardhat chain; then runs the full sequence again including subgraph deploy.

**Stop everything:** `npm run stop:all`

**Without Infisical:** Use a root `.env` (copy from `.env.example` and fill in) and run `npm run start:all` or `npm run start:all:restart` instead.

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
2. **Deploy** (terminal 2): `npm run deploy:local` (or `infisical run -- npm run deploy:local`) — updates frontend addresses and, if using `.env`, root `.env` (VITE_* for admin).
3. **Sync subgraph address:** `node subgraph/scripts/sync-address.js`
4. **Docker:** `infisical run -- docker compose up` (or `docker compose up` if using `.env`) — leave running.
5. **Subgraph** (from `subgraph/`): `npm run codegen && npm run build:localhost && npm run create-local && npm run deploy-local` (use `--version-label v0.0.x` if you need non-interactive deploy).
6. **Frontend:** `cd frontend && npm run dev`
7. **Admin:** `cd admin && npm run dev`

---

## Local Graph Node & subgraph

The subgraph indexes **ArkenstoneStaking** on the Hardhat chain so the admin dashboard can show rate history and volume/TVL over time.

- **Create/deploy** (one-time or after wiping `data/`): from `subgraph/`, run `npm run create-local` then `npm run deploy-local`.
- **After contract or mapping changes:** from `subgraph/`, run `npm run codegen`, `npm run build:localhost`, then `npm run deploy-local` with a new version.

### Hook up the Graph again (subgraph not connected)

If the admin dashboard doesn’t show rate history or volume from the subgraph:

1. **Run the full stack with Infisical** so Docker and the admin app get secrets: `npm run start:all:infisical`. Do not run `docker compose up` or `npm run start:all` without Infisical unless you have a root `.env` with `GRAPH_POSTGRES_PASSWORD` and `VITE_SUBGRAPH_URL`.
2. **If Hardhat was restarted** (new chain), the Graph Node is still indexing the old chain. Run `npm run start:all:restart:infisical` to wipe `data/`, bring everything up again, and redeploy the subgraph so it indexes the current chain.
3. **Ensure `VITE_SUBGRAPH_URL` is set in Infisical** (e.g. `http://localhost:5174/subgraphs/name/arkenstone/arkenstone` for the local proxy). The admin app needs this to query the subgraph. If you use `.env` instead, set it there.
4. **Check Graph Node:** `docker compose logs -f graph-node` for indexing or RPC errors.

### Changing the Postgres password

The Graph Node stack uses **`GRAPH_POSTGRES_PASSWORD`** for both the `postgres` and `graph-node` services. With Infisical, set or change it in the Infisical dashboard for your environment. If you use a root `.env`, set `GRAPH_POSTGRES_PASSWORD` there. If you change the password and Postgres was already initialized, stop the stack (`npm run stop:all`), remove `data/postgres` (and optionally `data/ipfs`), then start again with `npm run start:all:infisical` (or `npm run start:all` with `.env`); subgraph create/deploy will run as part of start.

### Subgraph not seeing Hardhat changes?

- **Hardhat restarts = new chain.** Each `npx hardhat node` run creates a new chain. The Graph Node keeps indexing the old one. **Fix:** Use `npm run start:all:restart` (or stop Docker, `rm -rf data`, `docker compose up`, then from `subgraph/`: `npm run create-local` and `npm run deploy-local`).
- **Address mismatch.** After redeploying contracts, run `node subgraph/scripts/sync-address.js`, then in `subgraph/`: `npm run build:localhost` and `npm run deploy-local`. Confirm `subgraph/networks.json` and `frontend/src/contracts/addresses.js` use the same staking address.
- **Hardhat not reachable from Docker.** Start Hardhat with `--hostname 0.0.0.0`.
- **Logs:** `docker compose logs -f graph-node` to see indexing or RPC errors.

---

## Admin app

- **Run:** With Infisical (recommended): `npm run start:all:infisical` starts the full stack and the admin app gets `VITE_*` from Infisical. To run only the admin app: `infisical run -- sh -c 'cd admin && npm run dev'` → http://localhost:5174. Without Infisical: ensure root `.env` exists and has at least `GRAPH_POSTGRES_PASSWORD` and optionally `VITE_SUBGRAPH_URL`; then `cd admin && npm run dev`. The admin app loads env from the repo root (Infisical injects when you use `infisical run`, or Vite reads `.env` from root).
- **Env:** `sync-admin-env.js` (run by `deploy:local` / `start:all`) can write `VITE_STAKING_ADDRESS`, `VITE_RPC_URL`, and `VITE_SUBGRAPH_URL` into the root `.env` if you use one; with Infisical, set those in the dashboard so the admin can query the subgraph.

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

1. Deploy contracts: `npm run deploy:sepolia:infisical` (or set `SEPOLIA_RPC_URL` and `PRIVATE_KEY` in Infisical; or use root `.env` and `npm run deploy:sepolia`).
2. Sync subgraph: `CHAIN_ID=11155111 node subgraph/scripts/sync-address.js`.
3. In `subgraph.yaml` set `network: sepolia` and optionally `source.startBlock`.
4. From `subgraph/`: `graph codegen`, `graph build`, then `graph auth` and `graph deploy` (Studio or Hosted Service).
5. Put the subgraph’s Query URL in Infisical as `VITE_SUBGRAPH_URL` (or in root `.env` if not using Infisical).

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

- **Admin shows "could not decode result data" or 0 TVL:** Admin is using an old staking address. Run `node scripts/sync-admin-env.js` (or `start:all:infisical` / `start:all`, which runs it), then refresh the admin page.
- **Admin "NetworkError" when fetching subgraph / Graph not connected:** See [Hook up the Graph again](#hook-up-the-graph-again-subgraph-not-connected) above. Use `npm run start:all:infisical` so Docker gets `GRAPH_POSTGRES_PASSWORD` and admin gets `VITE_SUBGRAPH_URL`; if Hardhat was restarted, use `npm run start:all:restart:infisical`.
- **Subgraph not updating:** Use `npm run start:all:restart:infisical` (or `start:all:restart` with `.env`) so the Graph Node wipes `data/` and re-indexes the current Hardhat chain.

---

## Tests

From project root:

```bash
npm test
```

This runs **Hardhat contract tests** (ArkenstoneStaking, ArkenstoneToken, AssetReceiver, AssetWithdrawler, Lock) and **script unit tests** for `sync-admin-env` and `sync-address` (subgraph). Script tests use temp directories and do not modify your real root `.env` or `subgraph/subgraph.yaml`.

- **Contract tests** — `test/ArkenstoneStaking.test.js`, `test/ArkenstoneToken.test.js`, etc. Deploy token + staking in-process and assert deployment, ETH/ARKN staking, rewards, owner rate updates, TVL, and edge cases (non-depositor stake info, multiple depositors).
- **Script tests** — `test/scripts/sync-admin-env.test.js`, `test/scripts/sync-address.test.js`. Test that `syncAdminEnv(root)` and `syncSubgraphAddress(subgraphDir, deploymentsPath, chainId)` write the expected env and YAML/networks.json from fixture deployment files.

---

## Cheatsheet

| Goal                         | Command |
|-----------------------------|--------|
| Start full stack (Infisical) | `npm run start:all:infisical` |
| Full restart / rehook Graph  | `npm run start:all:restart:infisical` |
| Stop full stack              | `npm run stop:all` |
| Deploy contracts only        | `npm run deploy:local` |
| Deploy to Sepolia (Infisical)| `npm run deploy:sepolia:infisical` |
| Sync subgraph address       | `node subgraph/scripts/sync-address.js` |
| Sync root .env (if using)    | `node scripts/sync-admin-env.js` |
| Subgraph build + deploy      | `cd subgraph && npm run codegen && npm run build:localhost && npm run deploy-local` |
| Stop Docker                  | `docker compose down` |
| Graph Node logs              | `docker compose logs -f graph-node` |

---

## Other docs

- **GRAPHQL_QUERIES.md** — Full GraphiQL examples (TVL snapshots, ARKN activity, etc.).
- **THE_GRAPH.md** — Contract events and suggested subgraph entities.
- **ADMIN_GRAPH_SETUP.md** — What the admin needs from the subgraph (URL, schema alignment).
- **CHEATSHEET.md** — Short reference (largely folded into this file).
