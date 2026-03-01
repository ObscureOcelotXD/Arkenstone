# Arkenstone — Start everything (cheat sheet)

All commands assume you’re at the **project root** unless noted.

---

## Quick start (one script)

From project root:

```bash
npm run start:all
```

Or:

```bash
./scripts/start-all.sh
```

To kill existing processes on ports 8545, 5173, 5174 first, then start again:

```bash
npm run start:all:restart
# or
./scripts/start-all.sh --restart
```

See [What the script does](#what-the-script-does) below.

---

## Manual start (order matters)

### 1. Hardhat node (terminal 1)

```bash
npx hardhat node --hostname 0.0.0.0
```

Leave running. Needed for deploy, frontend, admin, and Graph Node.

---

### 2. Deploy contracts (terminal 2, once per node restart)

```bash
npm run deploy:local
```

Updates `frontend/src/contracts/addresses.js`, creates `ignition/deployments/chain-31337/`, and syncs **admin/.env** with `VITE_STAKING_ADDRESS` so the admin uses the same contract.

---

### 3. Sync subgraph address (after deploy)

```bash
node subgraph/scripts/sync-address.js
```

Updates `subgraph/subgraph.yaml` and `subgraph/networks.json` for localhost.

---

### 4. Docker — Graph Node (terminal 2 or 3)

```bash
docker compose up
```

Leave running. Needed for admin “The Graph” section. Stop with Ctrl+C; to reset DB: `rm -rf data` then `docker compose up` again.

---

### 5. Subgraph — create + deploy (one-time, from `subgraph/`)

First time only (or after `rm -rf data`):

```bash
cd subgraph
npm install
npm run codegen
npm run build:localhost
npm run create-local
npm run deploy-local   # when prompted, version e.g. v0.0.1
cd ..
```

After contract or subgraph code changes:

```bash
cd subgraph
npm run codegen
npm run build:localhost
npm run deploy-local   # use new version, e.g. v0.0.2
cd ..
```

---

### 6. Frontend (terminal 3 or 4)

```bash
cd frontend && npm run dev
```

App: **http://localhost:5173**. MetaMask: network 127.0.0.1:8545, chain ID 31337.

---

### 7. Admin (terminal 4 or 5)

```bash
cd admin && npm run dev
```

App: **http://localhost:5174**. Set `admin/.env`:

- `VITE_RPC_URL=http://127.0.0.1:8545`
- `VITE_SUBGRAPH_URL=http://localhost:5174/subgraphs/name/arkenstone/arkenstone` (proxy via admin dev server to avoid CORS)

---

## Ports

| Port  | Service        |
|-------|----------------|
| 8545  | Hardhat node   |
| 5173  | Frontend (Vite)|
| 5174  | Admin (Vite)   |
| 8000  | Graph Node HTTP (queries) |
| 8020  | Graph Node admin API      |
| 5001  | IPFS (subgraph deploy)   |
| 5432  | Postgres (Docker)         |

---

## Restart / clean

- **Restart only app (keep node + Docker):** stop frontend/admin (Ctrl+C), then run `cd frontend && npm run dev` and `cd admin && npm run dev` again.
- **Restart Hardhat (fresh chain):** stop node (Ctrl+C), optionally delete `ignition/deployments/chain-31337`, then start node again and run `npm run deploy:local` + `node subgraph/scripts/sync-address.js`.
- **Restart Graph Node (fresh index):** stop Docker (Ctrl+C), `rm -rf data`, `docker compose up`, then from `subgraph/`: `npm run create-local` and `npm run deploy-local`.

---

## What the script does

`./scripts/start-all.sh`:

1. Optionally **kills** processes on 8545, 5173, 5174 if you pass `--restart`.
2. Starts **Hardhat node** in the background (`--hostname 0.0.0.0`).
3. Waits for the node, runs **deploy:local** and **sync-address**.
4. Starts **Docker** (graph-node, IPFS, postgres) in the background.
5. Starts **frontend** and **admin** dev servers in the background.
6. Prints URLs and a note that subgraph create/deploy is one-time (see manual steps above).

It does **not** run `create-local` / `deploy-local` (those are one-time or after subgraph changes). Run those from `subgraph/` when needed.

**If admin shows "could not decode result data" or 0 TVL:** the admin was using an old staking address. After deploy, run `node scripts/sync-admin-env.js` (or use `start:all`, which runs it), then refresh the admin page. If you don’t run the Graph Node, leave `VITE_SUBGRAPH_URL` unset in admin/.env so the dashboard doesn’t try to fetch (avoids "NetworkError when attempting to fetch resource").
