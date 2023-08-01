import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const RewardToken = await ethers.getContractFactory('RewardToken');
  const ethersToWei = ethers.utils.parseUnits("10000000", "ether");
  const rewardToken = await RewardToken.deploy(
    "TestRewardToken",  
    "TRT", 
    18, 
    ethersToWei,
    false
    );
  await rewardToken.deployed();

  console.log("Contract address:", rewardToken.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
