const { expect } = require("chai");
const { ethers } = require("hardhat");

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

  it("Should receive Ether successfully", async function () {
    // Send 1 ETH from owner to assetReceiver
    const tx = await owner.sendTransaction({
      to: await assetReceiver.getAddress(),
      value: ethers.parseEther("1.0"),
    });
    await tx.wait();

    // Check the contract's Ether balance using the getEtherBalance function
    const balance = await assetReceiver.getEtherBalance();
    expect(balance).to.equal(ethers.parseEther("1.0"));
  });

  it("Should receive ERC-20 tokens successfully using receiveTokens", async function () {
    // Deploy a MockERC20 token
    const Token = await ethers.getContractFactory("MockERC20");
    // Deploy with an initial supply of 1000 tokens (assuming 18 decimals)
    const initialSupply = ethers.parseUnits("1000", 18);
    const token = await Token.deploy("MockToken", "MTK", initialSupply);
    await token.waitForDeployment();

    // Define the token amount to send (100 tokens, 18 decimals)
    const tokenAmount = ethers.parseUnits("100", 18);
    
    // Approve the AssetReceiver contract to spend tokens
    await token.approve(await assetReceiver.getAddress(), tokenAmount);
    
    // Transfer tokens to the AssetReceiver via its receiveTokens function
    await assetReceiver.receiveTokens(await token.getAddress(), tokenAmount);

    // Check the token balance of the contract using the tokenBalance function
    const contractTokenBalance = await assetReceiver.tokenBalance(await token.getAddress());
    expect(contractTokenBalance).to.equal(tokenAmount);
  });

  it("Should return correct asset summary for Ether and a single token", async function () {
    // Send 1 ETH to the AssetReceiver
    const ethTx = await owner.sendTransaction({
      to: await assetReceiver.getAddress(),
      value: ethers.parseEther("1.0"),
    });
    await ethTx.wait();

    // Deploy and transfer tokens as in the previous test
    const Token = await ethers.getContractFactory("MockERC20");
    const initialSupply = ethers.parseUnits("1000", 18);
    const token = await Token.deploy("MockToken", "MTK", initialSupply);
    await token.waitForDeployment();

    const tokenAmount = ethers.parseUnits("100", 18);
    await token.approve(await assetReceiver.getAddress(), tokenAmount);
    await assetReceiver.receiveTokens(await token.getAddress(), tokenAmount);

    // Use the getAssetSummary function to retrieve both Ether and token balances
    const [etherBalance, tokenBalance] = await assetReceiver.getAssetSummary(await token.getAddress());
    expect(etherBalance).to.equal(ethers.parseEther("1.0"));
    expect(tokenBalance).to.equal(tokenAmount);
  });

  it("Should deposit multiple tokens and Ether via depositAssets", async function () {
    // Deploy two tokens dynamically and deposit both along with Ether
    const Token = await ethers.getContractFactory("MockERC20");
    const initialSupply = ethers.parseUnits("1000", 18);

    // Deploy token1 (e.g., MTK)
    const token1 = await Token.deploy("MockToken", "MTK", initialSupply);
    await token1.waitForDeployment();
    const token1Address = await token1.getAddress();
    // Deploy token2 (e.g., QTUM)
    const token2 = await Token.deploy("QTUM Token", "QTUM", initialSupply);
    await token2.waitForDeployment();
    const token2Address = await token2.getAddress();

    // Define deposit amounts for each token
    const token1Amount = ethers.parseUnits("100", 18);
    const token2Amount = ethers.parseUnits("50", 18);

    // Approve assetReceiver to spend tokens for both tokens
    await token1.approve(await assetReceiver.getAddress(), token1Amount);
    await token2.approve(await assetReceiver.getAddress(), token2Amount);

    // Call depositAssets with both tokens and send 1 ETH along
    const depositTx = await assetReceiver.depositAssets(
      [token1Address, token2Address],
      [token1Amount, token2Amount],
      { value: ethers.parseEther("1.0") }
    );
    await depositTx.wait();

    // Check Ether balance of the contract
    const etherBalance = await assetReceiver.getEtherBalance();
    expect(etherBalance).to.equal(ethers.parseEther("1.0"));

    // Check token balances individually
    const token1Balance = await assetReceiver.tokenBalance(token1Address);
    expect(token1Balance).to.equal(token1Amount);

    const token2Balance = await assetReceiver.tokenBalance(token2Address);
    expect(token2Balance).to.equal(token2Amount);
  });
});
