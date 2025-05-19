import { expect } from "chai";
import { ethers } from "hardhat";
import { KAI } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("KAI Token", function () {
  let kaiToken: KAI, owner: HardhatEthersSigner, addr1: HardhatEthersSigner, addr2: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const KAIFactory = await ethers.getContractFactory("KAI");
    kaiToken = await KAIFactory.deploy();
  });

  it("should have correct name and symbol", async function () {
    expect(await kaiToken.name()).to.equal("KAI Token");
    expect(await kaiToken.symbol()).to.equal("KAI");
  });

  it("should assign initial supply to owner", async function () {
    const totalSupply = await kaiToken.totalSupply();
    const ownerBalance = await kaiToken.balanceOf(owner.address);
    expect(ownerBalance).to.equal(totalSupply);
  });

  it("should allow owner to mint tokens", async function () {
    const amount = ethers.parseEther("1000");
    await kaiToken.mint(addr1.address, amount);
    expect(await kaiToken.balanceOf(addr1.address)).to.equal(amount);
  });

  it("should not allow non-owner to mint tokens", async function () {
    const amount = ethers.parseEther("1000");
    await expect(
        kaiToken.connect(addr1).mint(addr2.address, amount)
    ).to.be.revertedWithCustomError(kaiToken, "OwnableUnauthorizedAccount");
  });

  it("should allow users to burn their tokens", async function () {
    const amount = ethers.parseEther("500");
    await kaiToken.transfer(addr1.address, amount);
    await kaiToken.connect(addr1).burn(amount);
    expect(await kaiToken.balanceOf(addr1.address)).to.equal(0);
  });

  it("should allow approved burnFrom by another address", async function () {
    const amount = ethers.parseEther("1000");
    await kaiToken.transfer(addr1.address, amount);
    await kaiToken.connect(addr1).approve(owner.address, amount);
    await kaiToken.burnFrom(addr1.address, amount);
    expect(await kaiToken.balanceOf(addr1.address)).to.equal(0);
  });
});
