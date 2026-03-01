# Arkenstone Admin

Dashboard (TVL, rates, subgraph history) and Admin tab (owner rate updates). Built to be moved to a separate repo later.

**Setup and env:** See [docs/SETUP.md](../docs/SETUP.md) (sections **Admin app** and **Quick start**).

**Run locally:** From repo root, ensure you have a `.env` (e.g. `cp .env.example .env` and fill in); then `cd admin && npm install && npm run dev` → http://localhost:5174. The admin app reads `.env` from the repo root. For a full stack, use `npm run start:all` from the repo root.
