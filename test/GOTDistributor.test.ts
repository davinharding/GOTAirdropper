import { ethers, network } from "hardhat";
import { expect } from 'chai';
import { Contract, Signer } from 'ethers';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';

describe('GOTDistributor', function () {
  let RewardDistributor: any;
  let rewardDistributor: Contract;
  let owner: Signer, addr1: Signer, addr2: Signer, addr3: Signer;
  let rewardToken: any;
  const distributionRate: number = 10; // replace with your desired distribution rate
  let merkleTree: MerkleTree, leaf: Buffer, proof: any;

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
    await rewardToken.transfer(rewardDistributor.address, ethers.utils.parseEther('1000000'));
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
      await network.provider.send("hardhat_mine", [ethers.utils.hexlify(55600)]);

      const leaf = keccak256(await addr1.getAddress());
      const proof = merkleTree.getHexProof(leaf);

      await rewardDistributor.connect(addr1).claimReward(proof);

      const newBalance = await rewardToken.balanceOf(await addr1.getAddress());
      expect(parseFloat(ethers.utils.formatEther(newBalance.toString()))).to.equal(40);
    });

    // Add more tests for different edge cases
  });

  // Add more tests for different edge cases
});
