const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AssetReceiver Contract", function () {
  let AssetReceiver, assetReceiver, owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    AssetReceiver = await ethers.getContractFactory("AssetReceiver");
    assetReceiver = await AssetReceiver.deploy();
    await assetReceiver.waitForDeployment(); // Updated method

    const contractAddress = await assetReceiver.getAddress(); // Retrieve contract address
    console.log("AssetReceiver deployed to:", contractAddress);
  });

  it("Should receive Ether successfully", async function () {
    const tx = await owner.sendTransaction({
      to: await assetReceiver.getAddress(), // Ensure correct address retrieval
      value: ethers.parseEther("1.0"),
    });
    await tx.wait();

    const balance = await ethers.provider.getBalance(await assetReceiver.getAddress());
    expect(balance).to.equal(ethers.parseEther("1.0"));
  });

  it("Should receive ERC-20 tokens successfully", async function () {
    // Deploy a mock ERC-20 token
    const Token = await ethers.getContractFactory("MockERC20");
    const token = await Token.deploy("MockToken", "MTK", 1000);
    await token.waitForDeployment(); // Updated method

    // Approve and transfer tokens to the contract
    await token.approve(await assetReceiver.getAddress(), 100);
    await assetReceiver.receiveTokens(await token.getAddress(), 100);

    const contractTokenBalance = await token.balanceOf(await assetReceiver.getAddress());
    expect(contractTokenBalance).to.equal(100);
  });
});
