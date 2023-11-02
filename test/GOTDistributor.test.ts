import { network, ethers } from "hardhat";
import { expect } from 'chai';
import { Contract, Signer } from 'ethers';

describe('GOTDistributor', function () {
  let 
  RewardDistributor: any, 
  rewardDistributor: Contract, 
  owner: Signer, 
  addr1: Signer, 
  addr2: Signer, 
  addr3: Signer, 
  rewardToken: any 
  
  const distributionRate: any = ethers.BigNumber.from("10000000000000000000"); // 10e18 which represent 10 eth converted to wei.  This is because in prod we want to use small decimal values for this number which would otherwise break solidity since we must use integers
  

  beforeEach(async () => {
    RewardDistributor = await ethers.getContractFactory('GOTDistributor');
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    // Deploy a mock ERC20 token for the reward
    let ethersToWei = ethers.utils.parseUnits("10000000", "ether");
    const RewardToken = await ethers.getContractFactory('RewardToken');
    rewardToken = await RewardToken.deploy("Reward Token", "RTKN", 18, ethersToWei, true);
    await rewardToken.deployed();

    // Deploy the RewardDistributor contract
    
    rewardDistributor = await RewardDistributor.deploy(rewardToken.address, distributionRate) as Contract;
    await rewardDistributor.deployed();
    
    // Transfer tokens to the RewardDistributor contract
    await rewardToken.transfer(rewardDistributor.address, ethers.utils.parseEther('105'));

    // Set amount staked mapping
    let sources: string[] = await Promise.all([addr1.getAddress(), addr2.getAddress()])
    let amounts= [ethers.BigNumber.from((10000000000000000000000/1e18).toString()), ethers.BigNumber.from((20000000000000000000000/1e18).toString())];

    await rewardDistributor.updateAmountStaked(sources, amounts);
  });

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      expect(await rewardDistributor.owner()).to.equal(await owner.getAddress());
    });

    it('Should set the right reward token', async function () {
      expect(await rewardDistributor.rewardToken()).to.equal(await rewardToken.address);
    });
  });

  describe('claimReward', function () {
    it('Should fail if the address amount staked is 0', async function () {
      await expect(rewardDistributor.connect(addr3).claimReward()).to.be.revertedWith('No staked amount found for the sender');
    });

    it('Should succeed if the address has an amount staked', async function () {
      await network.provider.send("hardhat_mine", [ethers.utils.hexlify(41700)]);

      console.log(await rewardDistributor.amountStaked(addr1.getAddress()));

      await rewardDistributor.connect(addr1).claimReward();

      const newBalance = await rewardToken.balanceOf(await addr1.getAddress());

      expect(Math.round(parseFloat(ethers.utils.formatEther(newBalance.toString())))).to.equal(100); // even though 3 days have elapsed the first claim can only be for up to one day
    });

    it('Should revert if there are not enough tokens', async () => {
      await network.provider.send("hardhat_mine", [ethers.utils.hexlify(13900)]);

      await rewardDistributor.connect(addr1).claimReward();

      await network.provider.send("hardhat_mine", [ethers.utils.hexlify(13900)]);

      await expect(rewardDistributor.connect(addr1).claimReward()).to.be.revertedWith('Not enough tokens');

    })

    it('Should revert if claim is made before at least one day has elapsed', async () => {

      await rewardDistributor.connect(addr1).claimReward();

      await expect(rewardDistributor.connect(addr1).claimReward()).to.be.revertedWith("Must wait for a day before claiming");

    })

    it('Should revert if at least one day has not elapsed after a successful claim', async function () {
      await network.provider.send("hardhat_mine", [ethers.utils.hexlify(41700)]);

      await rewardDistributor.connect(addr1).claimReward();

      await expect(rewardDistributor.connect(addr1).claimReward()).to.be.revertedWith("Must wait for a day before claiming");
    });

    // Add more tests for different edge cases
  });

  describe('Ownership', () => {
    it('should be able to transfer ownership', async () => {
      await rewardDistributor.transferOwnership(addr1.getAddress());

      expect(await rewardDistributor.owner()).to.equal(await addr1.getAddress());
    })
  })

  describe('RewardToken', () => {
    it('should be able to update the rewardToken correctly', async () => {
      await rewardDistributor.updateRewardToken('0x14e4c61d6aa9accda3850b201077cebf464dcb31');

      const address = await rewardDistributor.rewardToken();

      expect(address.toLowerCase()).to.equal('0x14e4c61d6aa9accda3850b201077cebf464dcb31')
    })
  })

  describe('withdrawTokens', () => {
    it('should only be callable by the contract owner', async () => {
      const amountToWithdraw = ethers.utils.parseEther('10');
      
      // Non-owner account trying to withdraw tokens
      await expect(rewardDistributor.connect(addr1).withdrawTokens(amountToWithdraw)).to.be.revertedWith("Ownable: caller is not the owner");
    })

    it('should revert if the contract balance is insufficient', async () => {
      const amountToWithdraw = ethers.utils.parseEther('110');
      
      // Owner trying to withdraw more tokens than the contract balance
      await expect(rewardDistributor.connect(owner).withdrawTokens(amountToWithdraw)).to.be.revertedWith("Insufficient tokens in contract");
    })

    it('should successfully withdraw tokens when the contract has enough balance', async () => {
      const amountToWithdraw = ethers.utils.parseEther('10');
      const initialBalance = await rewardToken.balanceOf(await owner.getAddress());

      await rewardDistributor.connect(owner).withdrawTokens(amountToWithdraw);

      const newBalance = await rewardToken.balanceOf(await owner.getAddress());

      expect(newBalance).to.equal(initialBalance.add(amountToWithdraw));
    })
  })

  describe('claimWaitTimeInBlocks', () => {
    it('should set the claimWaitTimeInBlocks to 13900', async () => {
      expect(await rewardDistributor.claimWaitTimeInBlocks()).to.equal(13900);
    })

    it('should be able to update the claimWaitTimeInBlocks', async () => {
      await rewardDistributor.updateClaimWaitTimeInBlocks(0);

      expect(await rewardDistributor.claimWaitTimeInBlocks()).to.equal(0);
    })
  })


  // Add more tests for different edge cases
});
