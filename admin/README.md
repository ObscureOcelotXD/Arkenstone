# Arkenstone Admin

Dashboard and (future) admin actions for Arkenstone staking. Built to be moved to a separate repo later.

## Run locally

```bash
cd admin
npm install
cp .env.example .env   # optional: set VITE_RPC_URL, VITE_SUBGRAPH_URL
npm run dev
```

Open http://localhost:5174 (port 5174 to avoid clashing with main frontend on 5173).

## Env

| Variable | Description |
|----------|-------------|
| `VITE_RPC_URL` | RPC URL for the chain (default: `http://127.0.0.1:8545`) |
| `VITE_STAKING_ADDRESS` | Staking contract address (optional; default from config) |
| `VITE_SUBGRAPH_URL` | The Graph subgraph HTTP URL (optional). When set, Dashboard shows rate history and volume from the subgraph. |

## Dashboard

- **TVL (DeFi)** — Total ETH staked, total ARKN staked (from chain).
- **Interest rates** — Current ETH and ARKN pool APY (from chain).
- **The Graph** — Rate history and volume/TVL over time when `VITE_SUBGRAPH_URL` is set. Query shapes in `src/lib/subgraph.js` match the suggested schema in `docs/THE_GRAPH.md`; adjust once your subgraph is deployed.

## Later

- **Admin** tab: interest rate changes (owner-only), add/remove ERC‑20 eligibility. Will require wallet connection with owner privileges.
