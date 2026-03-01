# What the admin app needs from The Graph

**Main setup:** [SETUP.md](./SETUP.md) — full local stack and admin env.

---

## Short answer

- **The admin app does NOT use the Graph Hardhat plugin.** It only needs the **HTTP URL of a deployed subgraph** (e.g. `https://api.thegraph.com/subgraphs/name/your-org/arkenstone`). You set that in the repo root `.env` as `VITE_SUBGRAPH_URL`.
- **The Graph Hardhat plugin** (e.g. `@graphprotocol/hardhat-graph`) is optional. If you use it, it’s for **building and deploying** the subgraph from this repo (using your Hardhat deploy addresses/ABIs). The admin app still just needs the final subgraph URL.

---

## What the admin app does today

1. **Chain (RPC)** — Reads TVL and interest rates directly from the staking contract. No Graph involved. Works as soon as `VITE_RPC_URL` and the contract address are set.

2. **The Graph** — When `VITE_SUBGRAPH_URL` is set, the app sends **GraphQL queries** to that URL to fetch:
   - **Rate history** — past interest rate changes (from `InterestRateUpdated` / `ArknInterestRateUpdated`).
   - **Volume / TVL over time** — e.g. daily snapshots of TVL or deposit/withdraw volume.

The admin app is just a **client** of your subgraph. It doesn’t build or deploy the subgraph.

---

## What you need to do (pick one path)

### Option A: You already have (or will deploy) a subgraph

1. Create a subgraph project (in this repo or another) that indexes **ArkenstoneStaking** (see `docs/THE_GRAPH.md` for events and suggested entities).
2. Deploy it to [The Graph Hosted Service](https://thegraph.com/docs/en/hosted-service/) or [Subgraph Studio](https://thegraph.com/docs/en/studio/) (or self-host).
3. Copy the **subgraph HTTP URL** (the GraphQL endpoint).
4. In the repo root `.env` set:
   ```bash
   VITE_SUBGRAPH_URL=https://api.thegraph.com/subgraphs/name/<your-org>/<subgraph-name>
   ```
5. The admin app has **placeholder queries** in `admin/src/lib/subgraph.js`. Once your subgraph schema is fixed, we may need to align the query names and fields to match your schema (e.g. entity names like `interestRateChanges` or `InterestRateChange`).

**What I need from you:**  
- The **subgraph URL** once it’s deployed, and  
- If the schema is different from the placeholders (e.g. different entity or field names), the **GraphQL schema** or a sample query that works in the Graph Explorer, so we can update `subgraph.js` to match.

---

### Option B: You want to use the Graph Hardhat plugin

The [Graph Hardhat plugin](https://github.com/graphprotocol/hardhat-graph) helps you:

- Generate subgraph config (e.g. `subgraph.yaml`) from your Hardhat deployment (contract addresses, ABIs, network).
- Build and deploy the subgraph from the same repo.

Steps (high level):

1. Add the plugin and create a subgraph in this repo (e.g. `subgraph/` with `schema.graphql`, `subgraph.yaml`, mappings).
2. Use the plugin to point the subgraph at your deployed ArkenstoneStaking address and ABI.
3. Deploy the subgraph (via the plugin or Graph CLI) and get the **HTTP URL**.
4. Set `VITE_SUBGRAPH_URL` in the repo root `.env` as in Option A.

The **admin app does not use the plugin**. The plugin is only for generating/deploying the subgraph. The admin app still only needs the final subgraph URL and queries that match your schema.

**What I need from you:**  
- Same as Option A: the **subgraph URL** and, if different from the placeholders, the **schema or working query** so we can align `admin/src/lib/subgraph.js`.

---

## Summary

| Thing | Used by admin app? | Purpose |
|-------|--------------------|--------|
| **Subgraph HTTP URL** | Yes | So the app can run GraphQL queries for rate history and volume. |
| **Graph Hardhat plugin** | No | Optional; for building/deploying the subgraph from this repo. |
| **Subgraph schema / queries** | Indirectly | Admin queries in `subgraph.js` must match your deployed subgraph’s schema. |

**What to give me:**  
1. The **subgraph URL** when you have it, and  
2. If the admin’s current queries don’t match your schema, the **schema** or a **sample working query** so we can update `admin/src/lib/subgraph.js`.

Until then, the dashboard still works for **TVL and interest rates** from the chain; the “The Graph” section will show “Set VITE_SUBGRAPH_URL” or schema/query errors until the URL and queries are aligned.
