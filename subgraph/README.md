# Arkenstone Subgraph

Indexes **ArkenstoneStaking** events for the admin dashboard (TVL, rate history, volume). Built in this repo; you can move `subgraph/` to its own repo later.

**Full setup, local Graph Node, and troubleshooting:** [docs/SETUP.md](../docs/SETUP.md) (sections **Local Graph Node & subgraph**, **Subgraph**, **GraphQL queries**).

**Quick local deploy:** From repo root, `npm run start:all` (or `start:all:restart`) builds and deploys the subgraph automatically. To do it manually from `subgraph/`: `npm run codegen && npm run build:localhost && npm run create-local && npm run deploy-local`.
