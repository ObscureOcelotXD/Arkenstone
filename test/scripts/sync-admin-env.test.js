const { expect } = require("chai");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { syncAdminEnv, defaultRpc, defaultSubgraphUrl } = require("../../scripts/sync-admin-env.js");

describe("sync-admin-env", function () {
  let tmpDir;

  beforeEach(function () {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "arken-admin-env-"));
  });

  afterEach(function () {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("should return updated: false when deployment file does not exist", function () {
    const result = syncAdminEnv(tmpDir);
    expect(result.updated).to.equal(false);
  });

  it("should return updated: false when ArkenDeploy#ArkenstoneStaking is missing", function () {
    const deployDir = path.join(tmpDir, "ignition", "deployments", "chain-31337");
    fs.mkdirSync(deployDir, { recursive: true });
    fs.writeFileSync(
      path.join(deployDir, "deployed_addresses.json"),
      JSON.stringify({ "Other#Contract": "0x0000000000000000000000000000000000000001" })
    );
    const result = syncAdminEnv(tmpDir);
    expect(result.updated).to.equal(false);
  });

  it("should write root .env with staking address, RPC, and subgraph URL", function () {
    const deployDir = path.join(tmpDir, "ignition", "deployments", "chain-31337");
    fs.mkdirSync(deployDir, { recursive: true });
    fs.writeFileSync(
      path.join(deployDir, "deployed_addresses.json"),
      JSON.stringify({ "ArkenDeploy#ArkenstoneStaking": "0xE7F1725E7734CE288F8367E1BB143E90BB3F0512" })
    );
    const result = syncAdminEnv(tmpDir);
    expect(result.updated).to.equal(true);
    expect(result.staking).to.equal("0xE7F1725E7734CE288F8367E1BB143E90BB3F0512");

    const envPath = path.join(tmpDir, ".env");
    expect(fs.existsSync(envPath)).to.equal(true);
    const env = fs.readFileSync(envPath, "utf8");
    expect(env).to.include("VITE_STAKING_ADDRESS=0xE7F1725E7734CE288F8367E1BB143E90BB3F0512");
    expect(env).to.include("VITE_RPC_URL=" + defaultRpc);
    expect(env).to.include("VITE_SUBGRAPH_URL=" + defaultSubgraphUrl);
  });

  it("should update existing VITE_STAKING_ADDRESS and preserve existing VITE_SUBGRAPH_URL in root .env", function () {
    const deployDir = path.join(tmpDir, "ignition", "deployments", "chain-31337");
    fs.mkdirSync(deployDir, { recursive: true });
    fs.writeFileSync(
      path.join(deployDir, "deployed_addresses.json"),
      JSON.stringify({ "ArkenDeploy#ArkenstoneStaking": "0xAbCdEf1234567890AbCdEf1234567890AbCdEf12" })
    );
    fs.writeFileSync(
      path.join(tmpDir, ".env"),
      "VITE_STAKING_ADDRESS=0xold\nVITE_SUBGRAPH_URL=https://custom.graph/url\n"
    );
    const result = syncAdminEnv(tmpDir);
    expect(result.updated).to.equal(true);
    const env = fs.readFileSync(path.join(tmpDir, ".env"), "utf8");
    expect(env).to.include("VITE_STAKING_ADDRESS=0xAbCdEf1234567890AbCdEf1234567890AbCdEf12");
    expect(env).to.include("VITE_SUBGRAPH_URL=https://custom.graph/url");
    expect(result.subgraphAdded).to.equal(false);
  });
});
