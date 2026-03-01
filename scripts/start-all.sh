#!/usr/bin/env bash
# Start Hardhat, deploy contracts, Docker (Graph Node), subgraph deploy, frontend, and admin — one ready-to-go stack.
# From project root: ./scripts/start-all.sh
# Restart mode (kill ports, docker down, wipe Graph data, then start fresh): ./scripts/start-all.sh --restart

set -e
cd "$(dirname "$0")/.."
ROOT="$(pwd)"

RESTART=false
for arg in "$@"; do
  if [ "$arg" = "--restart" ]; then RESTART=true; fi
done

kill_port() {
  local port=$1
  local pids
  pids=$(lsof -t -i:"$port" 2>/dev/null) || true
  if [ -n "$pids" ]; then
    echo "Killing process(es) on port $port: $pids"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
}

if [ "$RESTART" = true ]; then
  echo "Restart mode: clearing ports 8545, 5173, 5174; stopping Docker; wiping Graph Node data..."
  kill_port 8545
  kill_port 5173
  kill_port 5174
  if command -v docker >/dev/null 2>&1; then
    docker compose down 2>/dev/null || true
  fi
  if [ -d "$ROOT/data" ]; then
    rm -rf "$ROOT/data"
    echo "Removed data/ so Graph Node will index the current Hardhat chain from scratch."
  fi
  sleep 2
fi

echo "Starting Hardhat node (background)..."
npx hardhat node --hostname 0.0.0.0 &
NODE_PID=$!
sleep 2

echo "Waiting for RPC on 8545..."
READY=false
i=0; while [ $i -lt 30 ]; do i=$((i+1));
  if STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' http://127.0.0.1:8545 2>/dev/null) && [ "$STATUS" = "200" ]; then
    READY=true
    break
  fi
  sleep 1
done
if [ "$READY" != true ]; then
  echo "Hardhat node did not become ready in time."
  kill $NODE_PID 2>/dev/null || true
  exit 1
fi

echo "Deploying contracts..."
npm run deploy:local

echo "Syncing subgraph address..."
node subgraph/scripts/sync-address.js

echo "Syncing admin .env with staking address..."
node scripts/sync-admin-env.js

if command -v docker >/dev/null 2>&1; then
  echo "Starting Docker (Graph Node, IPFS, Postgres)..."
  docker compose up -d
  echo "Waiting for Graph Node on port 8000 (may take 30–60s)..."
  j=0
  while [ $j -lt 60 ]; do
    if curl -s -o /dev/null --connect-timeout 2 http://127.0.0.1:8000/ 2>/dev/null; then
      echo "Graph Node is up."
      break
    fi
    sleep 2
    j=$((j + 2))
  done
  if [ $j -ge 60 ]; then
    echo "Graph Node did not respond in 60s; skipping subgraph deploy. Run from subgraph/: npm run create-local && npm run deploy-local"
  else
    echo "Building and deploying subgraph to local Graph Node..."
    (cd "$ROOT/subgraph" && npm run codegen && npm run build:localhost && (npm run create-local 2>/dev/null || true) && npx graph deploy --node http://127.0.0.1:8020 --ipfs http://127.0.0.1:5001 arkenstone/arkenstone --network localhost --version-label "v0.0.$(date +%s)")
    echo "Subgraph deployed; admin Dashboard will show rate history once data exists."
  fi
else
  echo "Docker not found; skipping Graph Node. Install Docker to use the subgraph."
fi

echo "Starting frontend (background)..."
(cd frontend && npm run dev) &
sleep 2

echo "Starting admin (background)..."
(cd admin && npm run dev) &
sleep 2

echo ""
echo "=============================================="
echo "  Arkenstone local stack started"
echo "=============================================="
echo "  Hardhat node:  http://127.0.0.1:8545 (chain 31337)"
echo "  Frontend:      http://localhost:5173  (wallet: connect to 127.0.0.1:8545, chain 31337)"
echo "  Admin:         http://localhost:5174  (Dashboard + Admin tab)"
echo "  Graph Node:    http://127.0.0.1:8000  (subgraph already deployed)"
echo ""
echo "  Full setup guide: docs/SETUP.md"
echo "  To stop: npm run stop:all"
echo "=============================================="
