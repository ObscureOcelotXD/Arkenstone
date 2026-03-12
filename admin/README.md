# Arkenstone Admin

Dashboard (TVL, rates, subgraph history) and Admin tab (owner rate updates). Built to be moved to a separate repo later.

**Setup and env:** See [docs/SETUP.md](../docs/SETUP.md) (sections **Admin app** and **Quick start**).

**Run locally:** This project uses Infisical for secrets. From repo root run `npm run start:all:infisical` to start the full stack (including admin at http://localhost:5174). To run only the admin app: `infisical run -- sh -c 'cd admin && npm run dev'`. Without Infisical, use a root `.env` and `cd admin && npm run dev`. See [docs/SETUP.md](../docs/SETUP.md) and [docs/INFISICAL.md](../docs/INFISICAL.md).
