import { expect } from "chai";
import { ethers } from "hardhat";
import { KAI, KAIPresale } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("KAIPresale", function () {
  let kai: KAI;
  let presale: KAIPresale;
  let owner: HardhatEthersSigner, treasury: HardhatEthersSigner, buyer: HardhatEthersSigner;

  beforeEach(async () => {
    [owner, treasury, buyer] = await ethers.getSigners();

    const KAI = await ethers.getContractFactory("KAI");
    kai = await KAI.deploy() as KAI;

    const Presale = await ethers.getContractFactory("KAIPresale");
    presale = await Presale.deploy(await kai.getAddress(), treasury.address) as KAIPresale;

    // Transfer tokens from owner to presale contract
    await kai.connect(owner).transfer(await presale.getAddress(), ethers.parseEther("1000000"));
  });

  it("should allow buyer to purchase tokens and transfer ETH to treasury", async () => {
    const rate = 300000;
    const ethSent = ethers.parseEther("1");
    const expectedTokens = ethSent * BigInt(rate);

    const treasuryBalanceBefore = await ethers.provider.getBalance(treasury.address);

    await expect(presale.connect(buyer).buyTokens({ value: ethSent }))
      .to.emit(presale, "TokensPurchased")
      .withArgs(await buyer.getAddress(), ethSent, expectedTokens);

    const treasuryBalanceAfter = await ethers.provider.getBalance(treasury.address);
    const buyerBalance = await kai.balanceOf(await buyer.getAddress());

    expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(ethSent);
    expect(buyerBalance).to.equal(expectedTokens);
  });

  it("should not allow purchases after sale ends", async () => {
    await presale.connect(owner).endSale();
    await expect(
      presale.connect(buyer).buyTokens({ value: ethers.parseEther("1") })
    ).to.be.revertedWith("Presale has ended");
  });

  it("should not allow exceeding the hard cap", async () => {
    const hardCap = ethers.parseEther("1000");
    await presale.connect(owner).endSale();

    const Presale = await ethers.getContractFactory("KAIPresale");
    const newPresale = await Presale.deploy(await kai.getAddress(), treasury.address) as KAIPresale;

    await kai.connect(owner).transfer(await newPresale.getAddress(), ethers.parseEther("1000000"));

    await expect(
      newPresale.connect(buyer).buyTokens({ value: hardCap + 1n })
    ).to.be.revertedWith("Hard cap reached");
  });

  it("should allow owner to withdraw remaining tokens after sale ends", async () => {
    await presale.connect(owner).endSale();
    const remaining = await kai.balanceOf(await presale.getAddress());

    await expect(presale.connect(owner).withdrawRemainingTokens(owner.address))
      .to.changeTokenBalances(kai, [presale, owner], [remaining * -1n, remaining]);
  });

  it("should not allow token withdrawal before ending sale", async () => {
    await expect(
      presale.connect(owner).withdrawRemainingTokens(owner.address)
    ).to.be.revertedWith("Sale still active");
  });
});