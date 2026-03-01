# Arkenstone Subgraph

Indexes **ArkenstoneStaking** events for the admin dashboard (TVL, rate history, volume). Built in this repo; you can move the `subgraph/` folder to its own repo later.

---

## Option A: Local Graph Node (no Sepolia, no faucet)

Use a **local Graph Node in Docker** to index your Hardhat chain. No Sepolia deploy or RPC keys needed.

**Prerequisites:** Docker (Docker Desktop or `docker compose`).

**1. Start Hardhat (so Docker can reach it):**
```bash
# From repo root — leave this running
npx hardhat node --hostname 0.0.0.0
```

**2. Deploy contracts** (in another terminal):
```bash
npm run deploy:local
```

**3. Sync subgraph** with the local address and set `network: localhost`:
```bash
node subgraph/scripts/sync-address.js
# (default CHAIN_ID=31337 → localhost)
```

**4. Build the subgraph:**
```bash
cd subgraph
npm install
npm run codegen
npm run build:localhost
```

**5. Start the local Graph Node** (from repo root, another terminal):
```bash
docker compose up
```
Leave it running. Wait until you see the graph-node service ready.

**6. Create and deploy the subgraph** to the local node (from `subgraph/`):
```bash
npm run create-local    # once
npm run deploy-local    # deploys with --network localhost
```

**7. Use the admin app with the subgraph**

In `admin/.env` set:
```bash
# Use localhost:5174 so the admin dev server proxies to Graph Node (avoids CORS)
VITE_SUBGRAPH_URL=http://localhost:5174/subgraphs/name/arkenstone/arkenstone
VITE_RPC_URL=http://127.0.0.1:8545
VITE_STAKING_ADDRESS=<paste from frontend/src/contracts/addresses.js after deploy:local>
```
Then run the admin app and open the Dashboard; the “The Graph” section will show rate history / data as you interact with the contracts.

**If you restart:** If you stop the Hardhat node, stop Docker, delete the `data/` folder (or run `rm -rf data`), then repeat from step 1 so the Graph Node re-syncs from a clean state.

---

## Option B: Deploy contracts to Sepolia first

The Graph indexes public networks (e.g. Sepolia), not local Hardhat. From the **repo root**:

1. Copy env and add your Sepolia RPC and wallet key:
   ```bash
   cp .env.example .env
   # Edit .env: SEPOLIA_RPC_URL (e.g. Infura/Alchemy), PRIVATE_KEY (wallet with Sepolia ETH)
   ```
2. Get Sepolia ETH from a faucet (e.g. https://sepoliafaucet.com) if needed.
3. Deploy:
   ```bash
   npm run deploy:sepolia
   ```
   This deploys ArkenstoneToken + ArkenstoneStaking to Sepolia and updates `frontend/src/contracts/addresses.js` for chain 11155111.

4. Sync the subgraph with the new address (and set network to sepolia):
   ```bash
   CHAIN_ID=11155111 node subgraph/scripts/sync-address.js
   ```
   Or from `subgraph/`: `CHAIN_ID=11155111 npm run sync-address`

5. In `subgraph.yaml`, set `source.startBlock` to your deployment block (from Sepolia Etherscan) for faster indexing, or leave `0`.

Then run `graph codegen` and `graph build` from `subgraph/` and deploy to The Graph (Studio or Hosted Service).

---

## Prerequisites

- Node 18+
- [Graph CLI](https://thegraph.com/docs/en/developing/creating-a-subgraph/#install-the-cli): `npm install -g @graphprotocol/graph-cli` (or use the local one via `npx`)

## Setup

```bash
cd subgraph
npm install
```

## Sync contract address (after deploy)

After deploying from the Arkenstone repo, update the subgraph with the new staking address:

```bash
# From repo root
node subgraph/scripts/sync-address.js

# Or from subgraph/
npm run sync-address
```

This overwrites `dataSources[0].source.address` in `subgraph.yaml` with the value from `ignition/deployments/chain-31337/deployed_addresses.json`.

## Build (run from `subgraph/`)

```bash
cd subgraph
npm run codegen    # generates generated/schema.ts and generated/ArkenstoneStaking/ from schema + ABI
npm run build      # compiles mapping to WASM
```

## Deploy via The Graph

1. Create a subgraph on [Subgraph Studio](https://thegraph.com/studio/) (or Hosted Service) and note the slug and network.
2. In `subgraph.yaml`, set `network` and `source.startBlock` for your chain (e.g. `mainnet`, `sepolia`).
3. Authenticate and deploy:

```bash
graph auth --studio <DEPLOY_KEY>
graph deploy --studio <SUBGRAPH_SLUG>
```

Or for Hosted Service:

```bash
graph auth https://api.thegraph.com/deploy/ <ACCESS_TOKEN>
graph deploy <GITHUB_USER>/<SUBGRAPH_NAME>
```

4. Copy the subgraph’s **Query URL** into the admin app’s `admin/.env` as `VITE_SUBGRAPH_URL`.

## Schema summary

| Entity             | Purpose |
|--------------------|--------|
| `Protocol`         | Singleton (`id: "global"`): totalEthStaked, totalArknStaked, current rates, updatedAt |
| `InterestRateChange` | Each ETH/ARKN rate change: pool, oldBps, newBps, timestamp |
| `EthDeposit` / `EthWithdraw` | ETH stake/unstake events for volume |
| `ArknDeposit` / `ArknWithdraw` | ARKN stake/unstake events for volume |

The admin app’s GraphQL queries in `admin/src/lib/subgraph.js` expect `InterestRateChange` (and optionally a daily snapshot entity). Once the subgraph is deployed, align those query names/fields with this schema if needed.


##Example Queries


# query {
#   protocol(id: "global") {
#     totalEthStaked
#     totalArknStaked
#     currentInterestRateBps
#     currentArknInterestRateBps
#   }
# }

# query {
#   interestRateChanges(first: 10, orderBy: timestamp, orderDirection: desc) {
#     id
#     pool
#     oldBps
#     newBps
#     timestamp
#   }
# }


query {
  ethDeposits(first: 5, orderBy: timestamp, orderDirection: desc) {
    id
    user
    amount
    timestamp
  }
}

# query {
#   ethWithdraws(first: 5, orderBy: timestamp, orderDirection: desc) {
#     id
#     user
#     amount
#     timestamp
#   }
# }