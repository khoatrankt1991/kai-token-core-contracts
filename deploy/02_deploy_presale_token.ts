import * as dotenv from "dotenv";
dotenv.config();
import { HardhatRuntimeEnvironment } from "hardhat/types";
import hre from 'hardhat'
const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS || ''

// npx hardhat verify --network sepolia 0x641A10285b1110001D6475D19395Adcfa64E5260 "0x7D98DF6357b07A3c0deDF849fD829f7296b818F5" "0x9764044233633B24965C8f3a6Cac94d04FEfe81E"
const deployContract = async (hre: HardhatRuntimeEnvironment) => {
    if (!TREASURY_ADDRESS) {
        throw new Error('TREASURY_ADDRESS is not set')
    }
    const kaiTokenAddress = "0x7D98DF6357b07A3c0deDF849fD829f7296b818F5"

    const presaleContract  = await hre.ethers.getContractFactory("KAIPresale")
    const presale = await presaleContract.deploy(kaiTokenAddress, TREASURY_ADDRESS);
    const presaleAddress = await presale.getAddress();
    console.log('presaleAddress', presaleAddress)
}
deployContract(hre).then().catch(err => {
    console.error(err);
    process.exitCode = 1;
})