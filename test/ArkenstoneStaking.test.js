const { expect } = require("chai");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { ethers, network } = require("hardhat");

const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;

describe("ArkenstoneStaking", function () {
  let arkn, staking, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const ArkenstoneToken = await ethers.getContractFactory("ArkenstoneToken");
    arkn = await ArkenstoneToken.deploy();
    await arkn.waitForDeployment();

    const ArkenstoneStaking = await ethers.getContractFactory("ArkenstoneStaking");
    staking = await ArkenstoneStaking.deploy(await arkn.getAddress());
    await staking.waitForDeployment();

    await arkn.setMinter(await staking.getAddress());
  });

  describe("Deployment", function () {
    it("Should set owner, token, and default interest rate (400 bps)", async function () {
      expect(await staking.owner()).to.equal(owner.address);
      expect(await staking.arkn()).to.equal(await arkn.getAddress());
      expect(await staking.interestRateBps()).to.equal(400);
      expect(await staking.arknInterestRateBps()).to.equal(400);
    });

    it("Should revert when token address is zero", async function () {
      const ArkenstoneStaking = await ethers.getContractFactory("ArkenstoneStaking");
      await expect(
        ArkenstoneStaking.deploy(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(staking, "ZeroAddress");
    });
  });

  describe("ETH staking", function () {
    it("Should accept ETH deposit and update stake info", async function () {
      const amount = ethers.parseEther("1");
      await expect(staking.deposit({ value: amount }))
        .to.emit(staking, "Deposited")
        .withArgs(owner.address, amount);

      const [staked, pending, lastUpdate] = await staking.getStakeInfo(owner.address);
      expect(staked).to.equal(amount);
      expect(lastUpdate).to.be.gt(0n);
    });

    it("Should revert on zero ETH deposit", async function () {
      await expect(staking.deposit({ value: 0 }))
        .to.be.revertedWithCustomError(staking, "ZeroAmount");
    });

    it("Should accrue pending rewards over time", async function () {
      await staking.deposit({ value: ethers.parseEther("1") });
      await network.provider.send("evm_increaseTime", [SECONDS_PER_YEAR]);
      await network.provider.send("evm_mine");

      const pending = await staking.getPendingRewards(owner.address);
      expect(pending).to.be.gt(0n);
    });

    it("Should allow claiming rewards without withdrawing", async function () {
      await staking.deposit({ value: ethers.parseEther("1") });
      await network.provider.send("evm_increaseTime", [SECONDS_PER_YEAR]);
      await network.provider.send("evm_mine");

      const pendingBefore = await staking.getPendingRewards(owner.address);
      expect(pendingBefore).to.be.gt(0n);

      await expect(staking.claimRewards())
        .to.emit(staking, "RewardsClaimed")
        .withArgs(owner.address, anyValue);

      expect(await arkn.balanceOf(owner.address)).to.be.gte(pendingBefore);
      expect(await staking.getPendingRewards(owner.address)).to.equal(0n);
    });

    it("Should revert claimRewards when no rewards", async function () {
      await expect(staking.claimRewards())
        .to.be.revertedWithCustomError(staking, "NoRewards");
    });

    it("Should withdraw ETH and claim rewards", async function () {
      await staking.deposit({ value: ethers.parseEther("2") });
      await network.provider.send("evm_increaseTime", [SECONDS_PER_YEAR]);
      await network.provider.send("evm_mine");

      const balanceBefore = await ethers.provider.getBalance(owner.address);
      const withdrawAmount = ethers.parseEther("1");
      const tx = await staking.withdraw(withdrawAmount);
      await tx.wait();

      const balanceAfter = await ethers.provider.getBalance(owner.address);
      expect(balanceAfter).to.be.gt(balanceBefore);
      const [staked] = await staking.getStakeInfo(owner.address);
      expect(staked).to.equal(ethers.parseEther("1"));
      expect(await staking.getPendingRewards(owner.address)).to.equal(0n);
    });

    it("Should revert withdraw with zero amount", async function () {
      await staking.deposit({ value: ethers.parseEther("1") });
      await expect(staking.withdraw(0))
        .to.be.revertedWithCustomError(staking, "ZeroAmount");
    });

    it("Should revert withdraw when insufficient stake", async function () {
      await staking.deposit({ value: ethers.parseEther("1") });
      await expect(staking.withdraw(ethers.parseEther("2")))
        .to.be.revertedWithCustomError(staking, "InsufficientStake");
    });
  });

  describe("ARKN staking", function () {
    beforeEach(async function () {
      // Stake so claim gives enough ARKN (4% APY): 2000 ETH -> 80 ARKN per year
      await staking.deposit({ value: ethers.parseEther("2000") });
      await network.provider.send("evm_increaseTime", [SECONDS_PER_YEAR]);
      await network.provider.send("evm_mine");
      await staking.claimRewards();
    });

    it("Should accept ARKN deposit", async function () {
      const amount = ethers.parseEther("50");
      await arkn.approve(await staking.getAddress(), amount);
      await expect(staking.depositArkn(amount))
        .to.emit(staking, "ArknDeposited")
        .withArgs(owner.address, amount);

      const [staked] = await staking.getArknStakeInfo(owner.address);
      expect(staked).to.equal(amount);
    });

    it("Should revert depositArkn with zero amount", async function () {
      await expect(staking.depositArkn(0))
        .to.be.revertedWithCustomError(staking, "ZeroAmount");
    });

    it("Should accrue and allow claiming ARKN stake rewards", async function () {
      const amount = ethers.parseEther("40");
      await arkn.approve(await staking.getAddress(), amount);
      await staking.depositArkn(amount);
      await network.provider.send("evm_increaseTime", [SECONDS_PER_YEAR]);
      await network.provider.send("evm_mine");

      const pending = await staking.getPendingArknRewards(owner.address);
      expect(pending).to.be.gt(0n);
      await staking.claimArknRewards();
      expect(await staking.getPendingArknRewards(owner.address)).to.equal(0n);
    });

    it("Should withdraw ARKN and claim rewards", async function () {
      const amount = ethers.parseEther("50");
      await arkn.approve(await staking.getAddress(), amount);
      await staking.depositArkn(amount);
      await network.provider.send("evm_increaseTime", [SECONDS_PER_YEAR]);
      await network.provider.send("evm_mine");

      const balanceBefore = await arkn.balanceOf(owner.address);
      await staking.withdrawArkn(ethers.parseEther("20"));
      expect(await arkn.balanceOf(owner.address)).to.be.gt(balanceBefore);
      const [staked] = await staking.getArknStakeInfo(owner.address);
      expect(staked).to.equal(ethers.parseEther("30"));
    });
  });

  describe("Owner", function () {
    it("Should allow owner to set interest rate (bps) within clamp", async function () {
      await expect(staking.setInterestRateBps(500))
        .to.emit(staking, "InterestRateUpdated")
        .withArgs(400, 500);
      expect(await staking.interestRateBps()).to.equal(500);
    });

    it("Should allow owner to set ARKN interest rate (bps) within clamp", async function () {
      await expect(staking.setArknInterestRateBps(1000))
        .to.emit(staking, "ArknInterestRateUpdated")
        .withArgs(400, 1000);
      expect(await staking.arknInterestRateBps()).to.equal(1000);
    });

    it("Should revert setInterestRateBps when out of range", async function () {
      await expect(staking.setInterestRateBps(50)).to.be.revertedWithCustomError(staking, "RateOutOfRange");
      await expect(staking.setInterestRateBps(1500)).to.be.revertedWithCustomError(staking, "RateOutOfRange");
    });

    it("Should revert setInterestRateBps when not owner", async function () {
      await expect(
        staking.connect(addr1).setInterestRateBps(500)
      ).to.be.revertedWithCustomError(staking, "NotOwner");
    });
  });

  describe("TVL", function () {
    it("Should report zero TVL initially", async function () {
      const [ethTvl, arknTvl] = await staking.getTVL();
      expect(ethTvl).to.equal(0n);
      expect(arknTvl).to.equal(0n);
    });

    it("Should update TVL on ETH deposit and withdraw", async function () {
      await staking.deposit({ value: ethers.parseEther("3") });
      expect(await staking.totalEthStaked()).to.equal(ethers.parseEther("3"));
      let [ethTvl] = await staking.getTVL();
      expect(ethTvl).to.equal(ethers.parseEther("3"));

      await staking.withdraw(ethers.parseEther("1"));
      expect(await staking.totalEthStaked()).to.equal(ethers.parseEther("2"));
      [ethTvl] = await staking.getTVL();
      expect(ethTvl).to.equal(ethers.parseEther("2"));
    });

    it("Should update TVL on ARKN deposit and withdraw", async function () {
      await staking.deposit({ value: ethers.parseEther("1500") });
      await network.provider.send("evm_increaseTime", [SECONDS_PER_YEAR]);
      await network.provider.send("evm_mine");
      await staking.claimRewards();

      const amount = ethers.parseEther("30");
      await arkn.approve(await staking.getAddress(), amount);
      await staking.depositArkn(amount);
      expect(await staking.totalArknStaked()).to.equal(amount);
      const [, arknTvl] = await staking.getTVL();
      expect(arknTvl).to.equal(amount);

      await staking.withdrawArkn(ethers.parseEther("10"));
      expect(await staking.totalArknStaked()).to.equal(ethers.parseEther("20"));
    });
  });
});
