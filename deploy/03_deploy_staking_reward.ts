import * as dotenv from "dotenv";
dotenv.config();
import { HardhatRuntimeEnvironment } from "hardhat/types";
import hre from 'hardhat'
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || ''

// npx hardhat verify --network sepolia 0x3cfECcF7379fdb424BB42D258fa10e63F1b0CC59 "0x7D98DF6357b07A3c0deDF849fD829f7296b818F5"
const deployContract = async (hre: HardhatRuntimeEnvironment) => {
    if (!TOKEN_ADDRESS) {
        throw new Error('TOKEN_ADDRESS is not set')
    }

    const stakingRewardContract  = await hre.ethers.getContractFactory("StakingReward")
    const stakingReward = await stakingRewardContract.deploy(TOKEN_ADDRESS);
    const stakingRewardAddress = await stakingReward.getAddress();
    console.log('stakingRewardAddress', stakingRewardAddress)
}
deployContract(hre).then().catch(err => {
    console.error(err);
    process.exitCode = 1;
})