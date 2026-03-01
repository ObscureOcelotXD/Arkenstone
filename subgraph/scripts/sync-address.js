/**
 * Copies the deployed ArkenstoneStaking address from Hardhat Ignition
 * into subgraph.yaml (dataSources[0].source.address).
 * For Sepolia also sets network: sepolia.
 *
 * Run from repo root:
 *   node subgraph/scripts/sync-address.js              # uses localhost chain 31337
 *   CHAIN_ID=11155111 node subgraph/scripts/sync-address.js   # Sepolia
 * Or from subgraph/: npm run sync-address
 */
const fs = require("fs");
const path = require("path");

/**
 * Sync subgraph.yaml and (for chain 31337) networks.json with staking address from deployment.
 * @param {string} subgraphDir - Path to subgraph/ (contains subgraph.yaml, networks.json)
 * @param {string} deploymentsPath - Full path to ignition/deployments/chain-X/deployed_addresses.json
 * @param {string} chainId - e.g. "31337" or "11155111"
 * @returns {{ address: string, network: string } | null} - address and network set, or null if missing
 */
function syncSubgraphAddress(subgraphDir, deploymentsPath, chainId) {
  if (!fs.existsSync(deploymentsPath)) {
    return null;
  }
  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  const address = deployments["ArkenDeploy#ArkenstoneStaking"];
  if (!address) {
    return null;
  }

  const subgraphPath = path.join(subgraphDir, "subgraph.yaml");
  let yaml = fs.readFileSync(subgraphPath, "utf8");
  yaml = yaml.replace(/address: "0x[a-fA-F0-9]+"/, `address: "${address}"`);
  const network = chainId === "11155111" ? "sepolia" : "localhost";
  yaml = yaml.replace(/\n\s*network: .+/, (m) => m.replace(/network: .+/, `network: ${network}`));
  fs.writeFileSync(subgraphPath, yaml);

  if (chainId === "31337") {
    const networksPath = path.join(subgraphDir, "networks.json");
    const networks = { localhost: { ArkenstoneStaking: { address, startBlock: 0 } } };
    fs.writeFileSync(networksPath, JSON.stringify(networks, null, 2) + "\n", "utf8");
  }
  return { address, network };
}

if (require.main === module) {
  const chainId = process.env.CHAIN_ID || "31337";
  const subgraphDir = path.join(__dirname, "..");
  const deploymentsPath = path.join(__dirname, "../../ignition/deployments", `chain-${chainId}`, "deployed_addresses.json");

  const result = syncSubgraphAddress(subgraphDir, deploymentsPath, chainId);
  if (!result) {
    if (!fs.existsSync(deploymentsPath)) {
      console.error("No deployment found at", deploymentsPath);
      console.error("Deploy first, e.g. npm run deploy:sepolia for Sepolia");
    } else {
      console.error("ArkenDeploy#ArkenstoneStaking not found in", deploymentsPath);
    }
    process.exit(1);
  }
  console.log("Set subgraph network to", result.network);
  console.log("Updated subgraph.yaml with address:", result.address);
  if (chainId === "31337") {
    console.log("Updated subgraph/networks.json for localhost");
  }
} else {
  module.exports = { syncSubgraphAddress };
}
