import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const RewardDistributor = await ethers.getContractFactory('GOTDistributor');
  const rewardDistributor = await RewardDistributor.deploy(
    "0x14e4c61d6aa9accda3850b201077cebf464dcb31",  
    "0x7fffb83a133f1662da069203b8de1c5a8b363dc6099ab93091c1e4e42293f018", 
    10, 
    );
  await rewardDistributor.deployed();

  console.log("Contract address:", rewardDistributor.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
