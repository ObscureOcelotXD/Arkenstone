#!/usr/bin/env node
/**
 * Writes VITE_STAKING_ADDRESS, VITE_RPC_URL, and VITE_SUBGRAPH_URL (when missing) to the
 * root .env from ignition/deployments/chain-31337/deployed_addresses.json.
 * Run after deploy:local so the admin app (which reads root .env) uses the same contract as the frontend.
 * VITE_SUBGRAPH_URL uses the admin dev server proxy to avoid CORS when using the local Graph Node.
 */
const fs = require("fs");
const path = require("path");

const defaultRpc = "http://127.0.0.1:8545";
const defaultSubgraphUrl = "http://localhost:5174/subgraphs/name/arkenstone/arkenstone";

/**
 * Sync root .env with staking address (and optional RPC/subgraph) from deployment.
 * @param {string} [root] - Repo root (default: parent of scripts/)
 * @returns {{ updated: boolean, staking?: string }} - updated: true if .env was written; staking address if found
 */
function syncAdminEnv(root = path.join(__dirname, "..")) {
  const deploymentsPath = path.join(root, "ignition/deployments/chain-31337/deployed_addresses.json");
  const envPath = path.join(root, ".env");

  if (!fs.existsSync(deploymentsPath)) {
    return { updated: false };
  }

  const data = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  const staking = data["ArkenDeploy#ArkenstoneStaking"];
  if (!staking) {
    return { updated: false };
  }

  let env = "";
  let stakingWritten = false;
  let rpcWritten = false;
  let subgraphWritten = false;

  if (fs.existsSync(envPath)) {
    env = fs.readFileSync(envPath, "utf8");
    const lines = env.split("\n");
    const out = [];
    for (const line of lines) {
      if (/^\s*VITE_STAKING_ADDRESS\s*=/.test(line)) {
        out.push(`VITE_STAKING_ADDRESS=${staking}`);
        stakingWritten = true;
      } else if (/^\s*VITE_RPC_URL\s*=/.test(line)) {
        out.push(line);
        rpcWritten = true;
      } else if (/^\s*VITE_SUBGRAPH_URL\s*=/.test(line)) {
        out.push(line);
        subgraphWritten = true;
      } else {
        out.push(line);
      }
    }
    env = out.join("\n");
  }

  if (!stakingWritten) {
    env = env.trimEnd() + (env ? "\n" : "") + `VITE_STAKING_ADDRESS=${staking}\n`;
  }
  if (!rpcWritten) {
    env = env.trimEnd() + (env ? "\n" : "") + `VITE_RPC_URL=${defaultRpc}\n`;
  }
  if (!subgraphWritten) {
    env = env.trimEnd() + (env ? "\n" : "") + `VITE_SUBGRAPH_URL=${defaultSubgraphUrl}\n`;
  }

  fs.writeFileSync(envPath, env, "utf8");
  return { updated: true, staking, subgraphAdded: !subgraphWritten };
}

if (require.main === module) {
  const root = path.join(__dirname, "..");
  const result = syncAdminEnv(root);
  if (!result.updated) {
    if (!fs.existsSync(path.join(root, "ignition/deployments/chain-31337/deployed_addresses.json"))) {
      console.warn("No deployment at ignition/deployments/chain-31337 - run npm run deploy:local first");
    } else {
      console.warn("No ArkenDeploy#ArkenstoneStaking in deployed_addresses.json");
    }
    process.exit(0);
  }
  const subgraphNote = result.subgraphAdded ? ", VITE_SUBGRAPH_URL (local proxy)" : "";
  console.log("Updated .env with VITE_STAKING_ADDRESS=" + result.staking + subgraphNote);
} else {
  module.exports = { syncAdminEnv, defaultRpc, defaultSubgraphUrl };
}
