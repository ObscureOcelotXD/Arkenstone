const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("AssetReceiver Contract", function () {
  let AssetReceiver, assetReceiver, owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    AssetReceiver = await ethers.getContractFactory("AssetReceiver");
    assetReceiver = await AssetReceiver.deploy();
    await assetReceiver.waitForDeployment();
    const contractAddress = await assetReceiver.getAddress();
    console.log("AssetReceiver deployed to:", contractAddress);
  });

  it("Should receive only Ether via depositAssets when no tokens are provided", async function () {
    // Call depositAssets with empty arrays and send 1 ETH.
    const depositTx = await assetReceiver.depositAssets([], [], { value: ethers.parseEther("1.0") });
    await depositTx.wait();

    // Check that the contract's Ether balance is 1 ETH.
    const balance = await assetReceiver.getEtherBalance();
    expect(balance).to.equal(ethers.parseEther("1.0"));
  });

  it("Should receive ERC-20 tokens successfully using receiveTokens", async function () {
    // Deploy a MockERC20 token.
    const Token = await ethers.getContractFactory("MockERC20");
    const initialSupply = ethers.parseUnits("1000", 18);
    const token = await Token.deploy("MockToken", "MTK", initialSupply);
    await token.waitForDeployment();

    // Define token amount (100 tokens, 18 decimals).
    const tokenAmount = ethers.parseUnits("100", 18);
    
    // Approve the AssetReceiver to spend tokens.
    await token.approve(await assetReceiver.getAddress(), tokenAmount);
    
    // Transfer tokens via the receiveTokens function.
    await assetReceiver.receiveTokens(await token.getAddress(), tokenAmount);

    // Check token balance of the contract.
    const contractTokenBalance = await assetReceiver.tokenBalance(await token.getAddress());
    expect(contractTokenBalance).to.equal(tokenAmount);
  });

  it("Should return correct asset summary for Ether and a single token", async function () {
    // Send 1 ETH to the AssetReceiver.
    const ethTx = await owner.sendTransaction({
      to: await assetReceiver.getAddress(),
      value: ethers.parseEther("1.0"),
    });
    await ethTx.wait();

    // Deploy a MockERC20 token and deposit tokens.
    const Token = await ethers.getContractFactory("MockERC20");
    const initialSupply = ethers.parseUnits("1000", 18);
    const token = await Token.deploy("MockToken", "MTK", initialSupply);
    await token.waitForDeployment();

    const tokenAmount = ethers.parseUnits("100", 18);
    await token.approve(await assetReceiver.getAddress(), tokenAmount);
    await assetReceiver.receiveTokens(await token.getAddress(), tokenAmount);

    // Retrieve asset summary.
    const [etherBalance, tokenBalance] = await assetReceiver.getAssetSummary(await token.getAddress());
    expect(etherBalance).to.equal(ethers.parseEther("1.0"));
    expect(tokenBalance).to.equal(tokenAmount);
  });

  it("Should deposit Ether and multiple tokens via depositAssets", async function () {
    // Deploy two tokens dynamically.
    const Token = await ethers.getContractFactory("MockERC20");
    const initialSupply = ethers.parseUnits("1000", 18);

    // Deploy token1 (TokenOne).
    const token1 = await Token.deploy("TokenOne", "TK1", initialSupply);
    await token1.waitForDeployment();
    const token1Address = await token1.getAddress();

    // Deploy token2 (TokenTwo).
    const token2 = await Token.deploy("TokenTwo", "TK2", initialSupply);
    await token2.waitForDeployment();
    const token2Address = await token2.getAddress();

    // Define deposit amounts.
    const token1Amount = ethers.parseUnits("100", 18);
    const token2Amount = ethers.parseUnits("50", 18);

    // Approve AssetReceiver for both tokens.
    await token1.approve(await assetReceiver.getAddress(), token1Amount);
    await token2.approve(await assetReceiver.getAddress(), token2Amount);

    // Deposit assets and 1 ETH.
    const depositTx = await assetReceiver.depositAssets(
      [token1Address, token2Address],
      [token1Amount, token2Amount],
      { value: ethers.parseEther("1.0") }
    );
    await depositTx.wait();

    // Verify Ether deposit.
    const ethBalance = await assetReceiver.getEtherBalance();
    expect(ethBalance).to.equal(ethers.parseEther("1.0"));

    // Verify token balances.
    const token1Balance = await assetReceiver.tokenBalance(token1Address);
    expect(token1Balance).to.equal(token1Amount);

    const token2Balance = await assetReceiver.tokenBalance(token2Address);
    expect(token2Balance).to.equal(token2Amount);
  });

  // New tests for storage duration tracking.
  it("Should track ETH storage duration", async function () {
    // Deposit 1 ETH.
    await owner.sendTransaction({
      to: await assetReceiver.getAddress(),
      value: ethers.parseEther("1.0"),
    });
    // Increase time by 60 seconds.
    await network.provider.send("evm_increaseTime", [60]);
    await network.provider.send("evm_mine");
    const duration = await assetReceiver.getEthStorageDuration(owner.address);
    // Expect duration to be at least 60 seconds.
    expect(duration).to.be.gte(60);
  });

  it("Should track token storage duration", async function () {
    // Deploy a MockERC20 token.
    const Token = await ethers.getContractFactory("MockERC20");
    const initialSupply = ethers.parseUnits("1000", 18);
    const token = await Token.deploy("MockToken", "MTK", initialSupply);
    await token.waitForDeployment();

    // Deposit 100 tokens.
    const tokenAmount = ethers.parseUnits("100", 18);
    await token.approve(await assetReceiver.getAddress(), tokenAmount);
    await assetReceiver.receiveTokens(await token.getAddress(), tokenAmount);

    // Increase time by 120 seconds.
    await network.provider.send("evm_increaseTime", [120]);
    await network.provider.send("evm_mine");
    const duration = await assetReceiver.getTokenStorageDuration(owner.address, await token.getAddress());
    // Expect duration to be at least 120 seconds.
    expect(duration).to.be.gte(120);
  });
});
