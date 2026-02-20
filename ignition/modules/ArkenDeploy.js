const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

// Deploys ArkenstoneToken (ARKN) and ArkenstoneStaking, then transfers
// minting rights to the staking contract so it can issue rewards.
module.exports = buildModule("ArkenDeploy", (m) => {
  const arkenstoneToken = m.contract("ArkenstoneToken");
  const arkenstoneStaking = m.contract("ArkenstoneStaking", [arkenstoneToken]);

  // Grant the staking contract permission to mint ARKN rewards.
  m.call(arkenstoneToken, "setMinter", [arkenstoneStaking]);

  return { arkenstoneToken, arkenstoneStaking };
});
