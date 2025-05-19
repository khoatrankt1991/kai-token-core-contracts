// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract StakingReward is Ownable, ReentrancyGuard {
    IERC20Metadata public tokenA;
    IERC20Permit public permitToken;

    struct StakingPlan {
        uint256 duration;
        uint256 rewardRate;
        bool isActive;
    }

    struct StakeInfo {
        uint256 amount;
        uint256 startTime;
        uint256 lockPeriod;
        uint256 rewardRate;
        uint256 planId;
        uint256 claimedReward;
        bool claimed;
    }

    mapping(uint256 => StakingPlan) public stakingPlans;
    mapping(address => StakeInfo[]) public userStakes;
    uint256 public totalPlans;

    event Staked(address indexed user, uint256 amount, uint256 planId, uint256 startTime);
    event Claimed(address indexed user, uint256 index, uint256 reward);
    event Unstaked(address indexed user, uint256 index, uint256 amount, uint256 reward);

    constructor(IERC20Metadata _tokenA) Ownable(msg.sender) {
        tokenA = _tokenA;
        permitToken = IERC20Permit(address(_tokenA));

        stakingPlans[0] = StakingPlan(0, 1500, true); // flexible
        stakingPlans[1] = StakingPlan(30 days, 2500, true);
        stakingPlans[2] = StakingPlan(180 days, 6000, true);
        totalPlans = 3;
    }

    function setStakingPlan(uint256 planId, uint256 duration, uint256 apy, bool active) external onlyOwner {
        if (duration == 0) require(apy <= 2000, "Flexible APY too high");
        stakingPlans[planId] = StakingPlan(duration, apy, active);
        if (planId >= totalPlans) {
            totalPlans = planId + 1;
        }
    }

    function stake(uint256 _amount, uint256 planId) public nonReentrant {
        require(_amount > 0, "Cannot stake 0");
        StakingPlan memory plan = stakingPlans[planId];
        require(plan.isActive, "Plan is not active");

        tokenA.transferFrom(msg.sender, address(this), _amount);

        userStakes[msg.sender].push(StakeInfo({
            amount: _amount,
            startTime: block.timestamp,
            lockPeriod: plan.duration,
            rewardRate: plan.rewardRate,
            planId: planId,
            claimedReward: 0,
            claimed: false
        }));

        emit Staked(msg.sender, _amount, planId, block.timestamp);
    }

    function stakeWithPermit(
        uint256 _amount,
        uint256 planId,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        permitToken.permit(msg.sender, address(this), _amount, deadline, v, r, s);
        stake(_amount, planId);
    }

    function claim(uint256 index) external nonReentrant {
        require(index < userStakes[msg.sender].length, "Invalid index");
        StakeInfo storage userStake = userStakes[msg.sender][index];
        require(!userStake.claimed, "Already unstaked");
        require(userStake.lockPeriod == 0, "Only flexible staking can be claimed");
        uint256 totalReward = calculateReward(userStake);
        uint256 claimable = totalReward - userStake.claimedReward;
        require(claimable > 1 ether, "No reward to claim");

        userStake.claimedReward += claimable;
        // userStake.startTime = block.timestamp;
        tokenA.transfer(msg.sender, claimable);

        emit Claimed(msg.sender, index, claimable);
    }

    function unstake(uint256 index) external nonReentrant {
        require(index < userStakes[msg.sender].length, "Invalid index");
        StakeInfo storage stakeInfo = userStakes[msg.sender][index];
        require(!stakeInfo.claimed, "Already claimed");

        bool isLocked = stakeInfo.lockPeriod > 0;
        uint256 endTime = stakeInfo.startTime + stakeInfo.lockPeriod;
        require(!isLocked || block.timestamp >= endTime, "Stake is still locked");

        stakeInfo.claimed = true;

        uint256 reward = calculateReward(stakeInfo);
        tokenA.transfer(msg.sender, stakeInfo.amount + reward);

        emit Unstaked(msg.sender, index, stakeInfo.amount, reward);
    }

    function calculateReward(StakeInfo memory info) internal view returns (uint256) {
        uint256 duration = info.lockPeriod == 0 ? block.timestamp - info.startTime : info.lockPeriod;
        return info.amount * info.rewardRate * duration / (10000 * 365 days);
    }

    function getReward(address user, uint256 index) external view returns (uint256) {
        require(index < userStakes[user].length, "Invalid index");
        StakeInfo memory stakeInfo = userStakes[user][index];
        if (stakeInfo.claimed) return 0;
        return calculateReward(stakeInfo) - stakeInfo.claimedReward;
    }

    function getUserStakes(address user) external view returns (StakeInfo[] memory) {
        return userStakes[user];
    }
} 
