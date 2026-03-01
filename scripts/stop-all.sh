#!/usr/bin/env bash
# Stop the full Arkenstone local stack: Hardhat (8545), frontend (5173), admin (5174), and Docker.
# From project root: ./scripts/stop-all.sh  or  npm run stop:all

set -e
cd "$(dirname "$0")/.."

kill_port() {
  local port=$1
  local pids
  pids=$(lsof -t -i:"$port" 2>/dev/null) || true
  if [ -n "$pids" ]; then
    echo "Stopping process(es) on port $port (PIDs: $pids)..."
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  else
    echo "Nothing running on port $port."
  fi
}

echo "Stopping Arkenstone local stack..."
kill_port 8545
kill_port 5173
kill_port 5174

if command -v docker >/dev/null 2>&1; then
  echo "Stopping Docker (Graph Node, IPFS, Postgres)..."
  docker compose down 2>/dev/null || true
else
  echo "Docker not found; skipping."
fi

echo ""
echo "Arkenstone stack stopped. Run npm run start:all to start again."
