const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AssetWithdrawler Contract", function () {
  let AssetReceiver, assetReceiver, AssetWithdrawler, assetWithdrawler, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy AssetReceiver and deposit 1 ETH.
    AssetReceiver = await ethers.getContractFactory("AssetReceiver");
    assetReceiver = await AssetReceiver.deploy();
    await assetReceiver.waitForDeployment();

    // Deposit 1 ETH into the AssetReceiver.
    await owner.sendTransaction({
      to: await assetReceiver.getAddress(),
      value: ethers.parseEther("1.0"),
    });

    // Deploy AssetWithdrawler with AssetReceiver's address and set addr1 as the recipient.
    AssetWithdrawler = await ethers.getContractFactory("AssetWithdrawler");
    assetWithdrawler = await AssetWithdrawler.deploy(
      await assetReceiver.getAddress(),
      addr1.address
    );
    await assetWithdrawler.waitForDeployment();

    // Update AssetReceiver's withdrawler to be the AssetWithdrawler contract.
    await assetReceiver.setWithdrawler(await assetWithdrawler.getAddress());
  });

  it("Should withdraw 1 ETH via AssetWithdrawler", async function () {
    // Record recipient (addr1) balance before withdrawal.
    const balanceBefore = await ethers.provider.getBalance(addr1.address);
  
    // Withdraw 1 ETH using the new withdrawal function.
    const withdrawTx = await assetWithdrawler.withdrawEther(ethers.parseEther("1.0"));
    await withdrawTx.wait();
  
    // AssetReceiver's balance should be 0 after the withdrawal.
    const receiverEth = await assetReceiver.getEtherBalance();
    expect(receiverEth).to.equal(0);
  
    // addr1's balance should have increased (minus gas fees).
    const balanceAfter = await ethers.provider.getBalance(addr1.address);
    expect(balanceAfter).to.be.gt(balanceBefore);
  });
  
  it("Should gracefully withdraw maximum available Ether if requested amount exceeds balance", async function () {
    // Deposit an additional 1 ETH.
    await owner.sendTransaction({
      to: await assetReceiver.getAddress(),
      value: ethers.parseEther("1.0"),
    });
  
    // Record recipient (addr1) balance before withdrawal.
    const balanceBefore = await ethers.provider.getBalance(addr1.address);
    
    // Try to withdraw 2 ETH, but only 1 ETH is available (since 1 ETH is already withdrawn).
    const withdrawTx = await assetWithdrawler.withdrawEther(ethers.parseEther("2.0"));
    await withdrawTx.wait();
  
    // AssetReceiver's balance should be 0 after withdrawal.
    const receiverBalance = await assetReceiver.getEtherBalance();
    expect(receiverBalance).to.equal(0);
    
    // Recipient's balance should have increased.
    const balanceAfter = await ethers.provider.getBalance(addr1.address);
    expect(balanceAfter).to.be.gt(balanceBefore);
  });

  it("Should withdraw tokens via AssetWithdrawler", async function () {
    // Deploy a MockERC20 token and deposit tokens into AssetReceiver.
    const Token = await ethers.getContractFactory("MockERC20");
    const initialSupply = ethers.parseUnits("1000", 18);
    const token = await Token.deploy("MockToken", "MTK", initialSupply);
    await token.waitForDeployment();
    
    // Deposit 200 tokens.
    const depositAmount = ethers.parseUnits("200", 18);
    await token.approve(await assetReceiver.getAddress(), depositAmount);
    await assetReceiver.receiveTokens(await token.getAddress(), depositAmount);
    
    // Withdraw 150 tokens using AssetWithdrawler.
    const withdrawAmount = ethers.parseUnits("150", 18);
    const withdrawTx = await assetWithdrawler.withdrawToken(await token.getAddress(), withdrawAmount);
    await withdrawTx.wait();
    
    // After withdrawal, AssetReceiver should have 50 tokens left.
    const remaining = await token.balanceOf(await assetReceiver.getAddress());
    expect(remaining).to.equal(ethers.parseUnits("50", 18));
  });

  it("Should revert withdrawEther when called by non-owner", async function () {
    await expect(
      assetWithdrawler.connect(addr2).withdrawEther(ethers.parseEther("0.5"))
    ).to.be.revertedWithCustomError(assetWithdrawler, "NotOwner");
  });

  it("Should revert withdrawToken when called by non-owner", async function () {
    const Token = await ethers.getContractFactory("MockERC20");
    const token = await Token.deploy("T", "T", ethers.parseUnits("1000", 18));
    await token.waitForDeployment();
    await expect(
      assetWithdrawler.connect(addr2).withdrawToken(await token.getAddress(), ethers.parseUnits("10", 18))
    ).to.be.revertedWithCustomError(assetWithdrawler, "NotOwner");
  });

  it("Should revert deployment when assetReceiver or recipient is zero", async function () {
    const AssetWithdrawler = await ethers.getContractFactory("AssetWithdrawler");
    await expect(
      AssetWithdrawler.deploy(ethers.ZeroAddress, addr1.address)
    ).to.be.revertedWithCustomError(assetWithdrawler, "ZeroAddress");
    await expect(
      AssetWithdrawler.deploy(await assetReceiver.getAddress(), ethers.ZeroAddress)
    ).to.be.revertedWithCustomError(assetWithdrawler, "ZeroAddress");
  });
});
