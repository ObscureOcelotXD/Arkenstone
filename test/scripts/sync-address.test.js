const { expect } = require("chai");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { syncSubgraphAddress } = require("../../subgraph/scripts/sync-address.js");

describe("sync-address (subgraph)", function () {
  let tmpDir;
  let subgraphDir;
  const minimalSubgraphYaml = `specVersion: 1.0.0
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum
    name: ArkenstoneStaking
    network: mainnet
    source:
      abi: ArkenstoneStaking
      address: "0x0000000000000000000000000000000000000000"
      startBlock: 0
`;

  beforeEach(function () {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "arken-sync-addr-"));
    subgraphDir = path.join(tmpDir, "subgraph");
    fs.mkdirSync(subgraphDir, { recursive: true });
    fs.writeFileSync(path.join(subgraphDir, "subgraph.yaml"), minimalSubgraphYaml);
  });

  afterEach(function () {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("should return null when deployment file does not exist", function () {
    const deploymentsPath = path.join(tmpDir, "nonexistent", "deployed_addresses.json");
    const result = syncSubgraphAddress(subgraphDir, deploymentsPath, "31337");
    expect(result).to.equal(null);
  });

  it("should return null when ArkenDeploy#ArkenstoneStaking is missing", function () {
    const deployDir = path.join(tmpDir, "ignition", "deployments", "chain-31337");
    fs.mkdirSync(deployDir, { recursive: true });
    fs.writeFileSync(
      path.join(deployDir, "deployed_addresses.json"),
      JSON.stringify({ "Other#Contract": "0x1234567890123456789012345678901234567890" })
    );
    const result = syncSubgraphAddress(subgraphDir, path.join(deployDir, "deployed_addresses.json"), "31337");
    expect(result).to.equal(null);
  });

  it("should update subgraph.yaml address and set network to localhost for chain 31337", function () {
    const deployDir = path.join(tmpDir, "deployments");
    fs.mkdirSync(deployDir, { recursive: true });
    const deploymentsPath = path.join(deployDir, "deployed_addresses.json");
    fs.writeFileSync(
      deploymentsPath,
      JSON.stringify({ "ArkenDeploy#ArkenstoneStaking": "0xE7F1725E7734CE288F8367E1BB143E90BB3F0512" })
    );
    const result = syncSubgraphAddress(subgraphDir, deploymentsPath, "31337");
    expect(result).to.not.equal(null);
    expect(result.address).to.equal("0xE7F1725E7734CE288F8367E1BB143E90BB3F0512");
    expect(result.network).to.equal("localhost");

    const yaml = fs.readFileSync(path.join(subgraphDir, "subgraph.yaml"), "utf8");
    expect(yaml).to.include('address: "0xE7F1725E7734CE288F8367E1BB143E90BB3F0512"');
    expect(yaml).to.include("network: localhost");

    const networksPath = path.join(subgraphDir, "networks.json");
    expect(fs.existsSync(networksPath)).to.equal(true);
    const networks = JSON.parse(fs.readFileSync(networksPath, "utf8"));
    expect(networks.localhost.ArkenstoneStaking.address).to.equal("0xE7F1725E7734CE288F8367E1BB143E90BB3F0512");
    expect(networks.localhost.ArkenstoneStaking.startBlock).to.equal(0);
  });

  it("should set network to sepolia for chain 11155111 and not write networks.json", function () {
    const deployDir = path.join(tmpDir, "deployments");
    fs.mkdirSync(deployDir, { recursive: true });
    const deploymentsPath = path.join(deployDir, "deployed_addresses.json");
    fs.writeFileSync(
      deploymentsPath,
      JSON.stringify({ "ArkenDeploy#ArkenstoneStaking": "0xAbCdEf1234567890AbCdEf1234567890AbCdEf12" })
    );
    const result = syncSubgraphAddress(subgraphDir, deploymentsPath, "11155111");
    expect(result).to.not.equal(null);
    expect(result.network).to.equal("sepolia");

    const yaml = fs.readFileSync(path.join(subgraphDir, "subgraph.yaml"), "utf8");
    expect(yaml).to.include("network: sepolia");
    expect(yaml).to.include('address: "0xAbCdEf1234567890AbCdEf1234567890AbCdEf12"');
  });
});
