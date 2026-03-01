#!/usr/bin/env node
/**
 * Writes VITE_STAKING_ADDRESS (and VITE_RPC_URL if missing) to admin/.env
 * from ignition/deployments/chain-31337/deployed_addresses.json.
 * Run after deploy:local so the admin app uses the same contract as the frontend.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const deploymentsPath = path.join(root, "ignition/deployments/chain-31337/deployed_addresses.json");
const adminEnvPath = path.join(root, "admin/.env");

if (!fs.existsSync(deploymentsPath)) {
  console.warn("No deployment at", deploymentsPath, "- run npm run deploy:local first");
  process.exit(0);
}

const data = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
const staking = data["ArkenDeploy#ArkenstoneStaking"];
if (!staking) {
  console.warn("No ArkenDeploy#ArkenstoneStaking in", deploymentsPath);
  process.exit(0);
}

const defaultRpc = "http://127.0.0.1:8545";
let env = "";
let stakingWritten = false;
let rpcWritten = false;

if (fs.existsSync(adminEnvPath)) {
  env = fs.readFileSync(adminEnvPath, "utf8");
  const lines = env.split("\n");
  const out = [];
  for (const line of lines) {
    if (/^\s*VITE_STAKING_ADDRESS\s*=/.test(line)) {
      out.push(`VITE_STAKING_ADDRESS=${staking}`);
      stakingWritten = true;
    } else if (/^\s*VITE_RPC_URL\s*=/.test(line)) {
      out.push(line);
      rpcWritten = true;
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

fs.writeFileSync(adminEnvPath, env, "utf8");
console.log("Updated admin/.env with VITE_STAKING_ADDRESS=" + staking);
