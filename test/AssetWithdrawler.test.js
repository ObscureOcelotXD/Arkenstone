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
    // Deposit 1 ETH.
    await owner.sendTransaction({
      to: await assetReceiver.getAddress(),
      value: ethers.parseEther("1.0"),
    });
  
    // Record recipient (addr1) balance before withdrawal.
    const balanceBefore = await ethers.provider.getBalance(addr1.address);
    
    // Try to withdraw 2 ETH, but only 1 ETH is available.
    const withdrawTx = await assetWithdrawler.withdrawEther(ethers.parseEther("2.0"));
    await withdrawTx.wait();
  
    // AssetReceiver's balance should be 0 after withdrawal.
    const receiverBalance = await assetReceiver.getEtherBalance();
    expect(receiverBalance).to.equal(0);
    
    // Recipient's balance should have increased (minus gas fees).
    const balanceAfter = await ethers.provider.getBalance(addr1.address);
    expect(balanceAfter).to.be.gt(balanceBefore);
  });
  

});
