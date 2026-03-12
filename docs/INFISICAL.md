# Infisical secret management

This project uses [Infisical](https://infisical.com) (free tier) for secrets. All sensitive config (passwords, API keys, wallet key, `VITE_*` for the admin app) lives in Infisical and is injected at runtime when you run commands through `infisical run` or the `npm run …:infisical` scripts. You do **not** need a `.env` file—you can leave it empty or delete it.

---

## What you need to do

### 1. Sign up and create a project (free tier)

1. Go to [infisical.com](https://infisical.com) and sign up.
2. Create a **workspace** (if prompted).
3. Create a **project** (e.g. “Arkenstone”).
4. Create at least one **environment** (e.g. `dev` for local, optionally `staging` / `prod` for other apps later). The free tier allows multiple projects and environments.

### 2. Add secrets in the Infisical dashboard

In your project → your environment (e.g. `dev`), add these **secret names** and values. Names must match exactly so the app and Docker Compose can read them.

| Secret name | Used by | Notes |
|-------------|---------|--------|
| `PRIVATE_KEY` | Hardhat (Sepolia deploy) | Wallet private key, no `0x` prefix. |
| `SEPOLIA_RPC_URL` | Hardhat | e.g. `https://sepolia.infura.io/v3/YOUR_PROJECT_ID` or Alchemy URL. |
| `GRAPH_POSTGRES_PASSWORD` | Docker Compose (graph-node + postgres) | Postgres password for the local Graph Node stack. |
| `VITE_RPC_URL` | Admin app (Vite) | e.g. `http://127.0.0.1:8545` for local. |
| `VITE_STAKING_ADDRESS` | Admin app | Optional; often set by `sync-admin-env` after deploy. Add in Infisical if you want it fixed per environment. |
| `VITE_SUBGRAPH_URL` | Admin app | Optional. e.g. `http://localhost:5174/subgraphs/name/arkenstone/arkenstone` for local proxy. |

You can add only the ones you use (e.g. for local-only: `GRAPH_POSTGRES_PASSWORD`, `VITE_RPC_URL`, and optionally `VITE_SUBGRAPH_URL`). For Sepolia deploys, add `PRIVATE_KEY` and `SEPOLIA_RPC_URL`.

### 3. Install the Infisical CLI

**macOS (Homebrew):**
```bash
brew install infisical/get-cli/infisical
```

**npm (any OS):**
```bash
npm install -g @infisical/cli
```

**Other options:** [Install docs](https://infisical.com/docs/cli/overview) (Windows: scoop/winget; Linux: deb/rpm/apk).

### 4. Log in and link this repo

From the **repo root**:

```bash
infisical login
```

Then link this directory to your Infisical project:

```bash
infisical init
```

Select your workspace → project → environment (e.g. `dev`). This creates `.infisical.json` (safe to commit; it only stores project/environment IDs, no secrets).

### 5. Run commands with secrets injected

Use `infisical run` (and optionally `--env=dev`) before any command that needs env vars. Examples:

**Full local stack (Hardhat, Docker, subgraph, frontend, admin):**
```bash
infisical run -- ./scripts/start-all.sh
# or
infisical run -- npm run start:all
```

**Restart local stack (wipe Graph data and redeploy subgraph):**
```bash
infisical run -- npm run start:all:restart
```

**Deploy contracts to Sepolia:**
```bash
infisical run -- npm run deploy:sepolia
```

**Only Docker (Graph Node):**
```bash
infisical run -- docker compose up
```

**Admin app only (if you run it separately):**
```bash
infisical run -- sh -c 'cd admin && npm run dev'
```

**Hardhat node only:**
```bash
infisical run -- npx hardhat node --hostname 0.0.0.0
```

If you use multiple environments (e.g. `dev` vs `prod`), specify one:
```bash
infisical run --env=prod -- npm run deploy:sepolia
```

---

## npm scripts that use Infisical

Convenience scripts are defined so you don’t have to type `infisical run` every time (requires Infisical CLI installed and `infisical login` + `infisical init` done):

| Script | Purpose |
|--------|---------|
| `npm run start:all:infisical` | Full stack with secrets from Infisical |
| `npm run start:all:restart:infisical` | Full restart with Infisical |
| `npm run deploy:sepolia:infisical` | Deploy to Sepolia with Infisical |
| `npm run docker:up:infisical` | `docker compose up` with Infisical |

**Fallback without Infisical:** Use a root `.env` (copy from `.env.example`) and run `npm run start:all`, `npm run deploy:sepolia`, etc.

---

## Do I need a `.env` file?

**No.** With Infisical you can leave `.env` empty or delete it. All required values are in Infisical and injected when you use `infisical run` or the `:infisical` scripts. If you keep a `.env` for local overrides or for tools that don't use Infisical, Infisical-injected vars still take precedence when you run via `infisical run`.

---

## Using Infisical across multiple apps

- **One project per app (recommended):** Create a separate Infisical project per repo (e.g. Arkenstone, other-app). Use environments like `dev` / `staging` / `prod` inside each project.
- **One project, many apps:** In a single Infisical project you can use multiple environments and/or path-based config later. For the free tier (e.g. 3 projects), one project per app keeps things clear.

For CI/CD (GitHub Actions, etc.), use **machine identities** and the `INFISICAL_TOKEN` env var instead of `infisical login`; see [Infisical docs](https://infisical.com/docs/cli/usage).
