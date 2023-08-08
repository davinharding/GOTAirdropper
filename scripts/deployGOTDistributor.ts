import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const RewardDistributor = await ethers.getContractFactory('GOTDistributor');
  const rewardDistributor = await RewardDistributor.deploy(
    "0xb8a9116493e191a43224e3971c7e9f23522b0883",  
    "0xac03a71939430b5488ac76e9c1f52b4f94bdb4aaaf7a7b594999a49d83efb525", 
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
