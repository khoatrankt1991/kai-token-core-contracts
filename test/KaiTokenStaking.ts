import { expect } from "chai";
import { ethers } from "hardhat";
import { KAI, StakingReward } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("TokenAStaking - Claim Tests", function () {
  let kai: KAI;
  let stakingReward: StakingReward;
  let owner: HardhatEthersSigner, user: HardhatEthersSigner;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    const KAI = await ethers.getContractFactory("KAI");
    kai = await KAI.deploy() as KAI;

    const StakingReward = await ethers.getContractFactory("StakingReward");
    stakingReward = await StakingReward.deploy(await kai.getAddress()) as StakingReward;

    // transfer 1_000_000 kai to stakingReward contract
    await kai.connect(owner).transfer(await stakingReward.getAddress(), ethers.parseEther("1000000"));

    // transfer 100_000 kai to user &  user approve stakingReward contract to spend
    const initUserBalance = ethers.parseEther("100000"); // 100_000 kai
    await kai.transfer(await user.getAddress(), initUserBalance);
    await kai.connect(user).approve(await stakingReward.getAddress(), initUserBalance);
  });

  it("should allow claiming rewards from flexible stake", async () => {
    await stakingReward.connect(user).stake(ethers.parseEther("10000"), 0); // Flexible plan
    await ethers.provider.send("evm_increaseTime", [86400]); // +1 day
    await ethers.provider.send("evm_mine", []);

    const rewardBefore = await stakingReward.getReward(await user.getAddress(), 0);
    expect(rewardBefore).to.be.gt(ethers.parseEther("4"));

    const userBalanceBefore = await kai.balanceOf(await user.getAddress());
    await stakingReward.connect(user).claim(0);
    const userBalanceAfter = await kai.balanceOf(await user.getAddress());

    expect(userBalanceAfter).to.be.gt(userBalanceBefore);
  });
  it("should allow unstake from flexible stake", async () => {
    await stakingReward.connect(user).stake(ethers.parseEther("100"), 0); // Flexible plan
    await ethers.provider.send("evm_increaseTime", [86400]); // +1 day
    await ethers.provider.send("evm_mine", []);

    const rewardBefore = await stakingReward.getReward(await user.getAddress(), 0);
    expect(rewardBefore).to.be.gt(ethers.parseEther("0.04"));

    const userBalanceBefore = await kai.balanceOf(await user.getAddress());
    await stakingReward.connect(user).unstake(0)
    const userBalanceAfter = await kai.balanceOf(await user.getAddress());

    expect(userBalanceAfter).to.be.gt(userBalanceBefore);
  });

  it("should not allow claiming twice without new rewards", async () => {
    
    await stakingReward.connect(user).stake(ethers.parseEther("100"), 0);
    const userBalanceBefore = await kai.balanceOf(await user.getAddress());
    // Increase time by 1 day
    await ethers.provider.send("evm_increaseTime", [8640000]);
    await ethers.provider.send("evm_mine", []);

    // First claim should succeed
    await stakingReward.connect(user).claim(0);

    // Second claim should revert
    await expect(
      stakingReward.connect(user).claim(0)
    ).to.be.revertedWith("No reward to claim");
  });

  it("should revert claim on locked staking plan (e.g. 30 days)", async () => {
    await stakingReward.connect(user).stake(ethers.parseEther("100"), 1);
    await ethers.provider.send("evm_increaseTime", [86400]);
    await ethers.provider.send("evm_mine", []);

    await expect(
      stakingReward.connect(user).claim(0)
    ).to.be.revertedWith("Only flexible staking can be claimed");
  });
});