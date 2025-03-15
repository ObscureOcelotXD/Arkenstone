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

  it("Should withdraw Ether via AssetWithdrawler", async function () {
    // Record recipient (addr1) balance before withdrawal.
    const balanceBefore = await ethers.provider.getBalance(addr1.address);

    // Call withdrawAllEther on AssetWithdrawler.
    const withdrawTx = await assetWithdrawler.withdrawAllEther();
    await withdrawTx.wait();

    // AssetReceiver's balance should be 0 after withdrawal.
    const receiverEth = await assetReceiver.getEtherBalance();
    expect(receiverEth).to.equal(0);

    // addr1's balance should have increased (minus gas fees).
    const balanceAfter = await ethers.provider.getBalance(addr1.address);
    expect(balanceAfter).to.be.gt(balanceBefore);
  });
});
