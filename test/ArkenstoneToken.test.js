const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ArkenstoneToken", function () {
  let token, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const ArkenstoneToken = await ethers.getContractFactory("ArkenstoneToken");
    token = await ArkenstoneToken.deploy();
    await token.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set name and symbol", async function () {
      expect(await token.name()).to.equal("Arkenstone");
      expect(await token.symbol()).to.equal("ARKN");
    });

    it("Should set deployer as minter", async function () {
      expect(await token.minter()).to.equal(owner.address);
    });

    it("Should have zero initial supply", async function () {
      expect(await token.totalSupply()).to.equal(0n);
    });
  });

  describe("Minting", function () {
    it("Should allow minter to mint to an address", async function () {
      const amount = ethers.parseEther("1000");
      await token.mint(addr1.address, amount);
      expect(await token.balanceOf(addr1.address)).to.equal(amount);
      expect(await token.totalSupply()).to.equal(amount);
    });

    it("Should emit Transfer on mint", async function () {
      const amount = ethers.parseEther("50");
      await expect(token.mint(addr1.address, amount))
        .to.emit(token, "Transfer")
        .withArgs(ethers.ZeroAddress, addr1.address, amount);
    });

    it("Should revert when non-minter tries to mint", async function () {
      await expect(
        token.connect(addr1).mint(addr2.address, ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(token, "NotMinter");
    });
  });

  describe("setMinter", function () {
    it("Should allow minter to transfer minter role", async function () {
      await expect(token.setMinter(addr1.address))
        .to.emit(token, "MinterUpdated")
        .withArgs(owner.address, addr1.address);
      expect(await token.minter()).to.equal(addr1.address);
    });

    it("Should revert when non-minter calls setMinter", async function () {
      await expect(
        token.connect(addr1).setMinter(addr2.address)
      ).to.be.revertedWithCustomError(token, "NotMinter");
    });

    it("Should revert when setting zero address as minter", async function () {
      await expect(
        token.setMinter(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(token, "ZeroAddress");
    });

    it("New minter can mint after transfer", async function () {
      await token.setMinter(addr1.address);
      await token.connect(addr1).mint(addr2.address, ethers.parseEther("100"));
      expect(await token.balanceOf(addr2.address)).to.equal(ethers.parseEther("100"));
    });
  });

  describe("Transfers", function () {
    beforeEach(async function () {
      await token.mint(owner.address, ethers.parseEther("1000"));
    });

    it("Should allow transfer between accounts", async function () {
      const amount = ethers.parseEther("100");
      await token.transfer(addr1.address, amount);
      expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("900"));
      expect(await token.balanceOf(addr1.address)).to.equal(amount);
    });
  });
});
