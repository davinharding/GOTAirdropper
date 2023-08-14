import { network, ethers } from "hardhat";
import { expect } from 'chai';
import { Contract, Signer } from 'ethers';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';

describe('GOTDistributor', function () {
  let 
  RewardDistributor: any, 
  rewardDistributor: Contract, 
  owner: Signer, 
  addr1: Signer, 
  addr2: Signer, 
  addr3: Signer, 
  rewardToken: any, 
  merkleTree: MerkleTree;
  
  const distributionRate: number = 10; // replace with your desired distribution rate
  

  beforeEach(async () => {
    RewardDistributor = await ethers.getContractFactory('GOTDistributor');
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    
    // Generate a merkle tree for the test
    const testLeaves: Buffer[] = await Promise.all([owner, addr1, addr2, addr3].map(async address => keccak256(await address.getAddress())));

    merkleTree = new MerkleTree(testLeaves, keccak256, { sort: true });
    const merkleRoot: string = merkleTree.getHexRoot();

    // Deploy a mock ERC20 token for the reward
    let ethersToWei = ethers.utils.parseUnits("10000000", "ether");
    const RewardToken = await ethers.getContractFactory('RewardToken');
    rewardToken = await RewardToken.deploy("Reward Token", "RTKN", 18, ethersToWei, true);
    await rewardToken.deployed();

    // Deploy the RewardDistributor contract
    
    rewardDistributor = await RewardDistributor.deploy(rewardToken.address, merkleRoot, distributionRate) as Contract;
    await rewardDistributor.deployed();
    
    // Transfer tokens to the RewardDistributor contract
    await rewardToken.transfer(rewardDistributor.address, ethers.utils.parseEther('35'));

    // Approve rewardDistributor for spending
    // await rewardToken.approve(rewardDistributor.address, '1000000000000000000000000');
  });

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      expect(await rewardDistributor.owner()).to.equal(await owner.getAddress());
    });

    it('Should set the right reward token', async function () {
      expect(await rewardDistributor.rewardToken()).to.equal(await rewardToken.address);
    });

    it('Should set the right merkle root', async function () {
      expect(await rewardDistributor.merkleRoot()).to.equal(merkleTree.getHexRoot());
    });
  });

  describe('claimReward', function () {
    it('Should fail if the merkle proof is invalid', async function () {
      await expect(rewardDistributor.connect(owner).claimReward([])).to.be.revertedWith('Invalid merkle proof');
    });

    it('Should succeed if the merkle proof is valid', async function () {
      await network.provider.send("hardhat_mine", [ethers.utils.hexlify(41700)]);

      const leaf = keccak256(await addr1.getAddress());
      const proof = merkleTree.getHexProof(leaf);
      await rewardDistributor.connect(addr1).claimReward(proof);

      const newBalance = await rewardToken.balanceOf(await addr1.getAddress());

      expect(Math.round(parseFloat(ethers.utils.formatEther(newBalance.toString())))).to.equal(30);
    });

    it('Should revert if there are not enough tokens', async () => {
      await network.provider.send("hardhat_mine", [ethers.utils.hexlify(55600)]);

      const leaf = keccak256(await addr1.getAddress());
      const proof = merkleTree.getHexProof(leaf);

      await expect(rewardDistributor.connect(addr1).claimReward(proof)).to.be.revertedWith('Not enough tokens');

    })

    it('Should revert if claim is made before at least one day has elapsed', async () => {
      const leaf = keccak256(await addr1.getAddress());
      const proof = merkleTree.getHexProof(leaf);

      await expect(rewardDistributor.connect(addr1).claimReward(proof)).to.be.revertedWith("Must wait for a day before claiming");

    })

    it('Should revert if at least one day has not elapsed after a successful claim', async function () {
      await network.provider.send("hardhat_mine", [ethers.utils.hexlify(41700)]);

      const leaf = keccak256(await addr1.getAddress());
      const proof = merkleTree.getHexProof(leaf);

      await rewardDistributor.connect(addr1).claimReward(proof);

      await expect(rewardDistributor.connect(addr1).claimReward(proof)).to.be.revertedWith("Must wait for a day before claiming");
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
      const amountToWithdraw = ethers.utils.parseEther('50');
      
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
