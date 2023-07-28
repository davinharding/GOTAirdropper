import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const RewardDistributor = await ethers.getContractFactory('GOTDistributor');
  const rewardDistributor = await RewardDistributor.deploy(
    "0xfdbf39114ba853d811032d3e528c2b4b7adcecd6",  
    "TRT", 
    18, 
    1000000,
    false
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
