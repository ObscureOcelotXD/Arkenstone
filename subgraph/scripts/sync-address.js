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

const chainId = process.env.CHAIN_ID || "31337";
const deploymentsPath = path.join(__dirname, "../../ignition/deployments", `chain-${chainId}`, "deployed_addresses.json");
const subgraphPath = path.join(__dirname, "..", "subgraph.yaml");

if (!fs.existsSync(deploymentsPath)) {
  console.error("No deployment found at", deploymentsPath);
  console.error("Deploy first, e.g. npm run deploy:sepolia for Sepolia");
  process.exit(1);
}

const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
const address = deployments["ArkenDeploy#ArkenstoneStaking"];
if (!address) {
  console.error("ArkenDeploy#ArkenstoneStaking not found in", deploymentsPath);
  process.exit(1);
}

let yaml = fs.readFileSync(subgraphPath, "utf8");
yaml = yaml.replace(/address: "0x[a-fA-F0-9]+"/, `address: "${address}"`);
if (chainId === "11155111") {
  yaml = yaml.replace(/\nnetwork: .+/, "\nnetwork: sepolia");
  console.log("Set subgraph network to sepolia");
} else if (chainId === "31337") {
  yaml = yaml.replace(/\nnetwork: .+/, "\nnetwork: localhost");
  console.log("Set subgraph network to localhost (for local Graph Node)");
}
fs.writeFileSync(subgraphPath, yaml);
console.log("Updated subgraph.yaml with address:", address);

if (chainId === "31337") {
  const networksPath = path.join(__dirname, "..", "networks.json");
  const networks = { localhost: { ArkenstoneStaking: { address, startBlock: 0 } } };
  fs.writeFileSync(networksPath, JSON.stringify(networks, null, 2) + "\n", "utf8");
  console.log("Updated subgraph/networks.json for localhost");
}
