# Arkenstone — Cheatsheet

Short reference. **Full guide:** [SETUP.md](./SETUP.md).

| Goal | Command |
|------|--------|
| Start full stack (Hardhat, Docker, subgraph, frontend, admin) | `npm run start:all` |
| Full restart (ports + Docker + wipe data + subgraph redeploy) | `npm run start:all:restart` |
| Stop full stack | `npm run stop:all` |
| Deploy contracts | `npm run deploy:local` |
| Sync subgraph address | `node subgraph/scripts/sync-address.js` |
| Sync admin .env | `node scripts/sync-admin-env.js` |
| Subgraph build + deploy | `cd subgraph && npm run codegen && npm run build:localhost && npm run deploy-local` |
| Stop Docker | `docker compose down` |
| Graph Node logs | `docker compose logs -f graph-node` |
| Run all tests | `npm test` |

**Ports:** 8545 Hardhat, 5173 frontend, 5174 admin, 8000 Graph Node.
