import { HardhatRuntimeEnvironment } from "hardhat/types";
import hre from 'hardhat'
const deployContract = async (hre: HardhatRuntimeEnvironment) => {
    const kaiTokenContract  = await hre.ethers.getContractFactory("KAI")
    const kaiToken = await kaiTokenContract.deploy();
    const kaiTokenAddress = await kaiToken.getAddress();
    console.log('kaiTokenAddress', kaiTokenAddress)
}
deployContract(hre).then().catch(err => {
    console.error(err);
    process.exitCode = 1;
})