# Arkenstone — Cheatsheet

Short reference. **Full guide:** [SETUP.md](./SETUP.md). **Secrets:** This project uses [Infisical](https://infisical.com); see [INFISICAL.md](./INFISICAL.md). No `.env` needed (leave empty or delete).

| Goal | Command |
|------|--------|
| Start full stack (Infisical) | `npm run start:all:infisical` |
| Full restart / rehook Graph | `npm run start:all:restart:infisical` |
| Stop full stack | `npm run stop:all` |
| Deploy contracts | `npm run deploy:local` |
| Deploy to Sepolia (Infisical) | `npm run deploy:sepolia:infisical` |
| Sync subgraph address | `node subgraph/scripts/sync-address.js` |
| Sync root .env (if using) | `node scripts/sync-admin-env.js` |
| Subgraph build + deploy | `cd subgraph && npm run codegen && npm run build:localhost && npm run deploy-local` |
| Stop Docker | `docker compose down` |
| Graph Node logs | `docker compose logs -f graph-node` |
| Run all tests | `npm test` |

**Ports:** 8545 Hardhat, 5173 frontend, 5174 admin, 8000 Graph Node.
