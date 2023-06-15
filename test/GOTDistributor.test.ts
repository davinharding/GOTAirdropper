import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Contract, Signer } from 'ethers';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';
import { GOTDistributor } from '../typechain-types';

describe('GOTDistributor', function () {
  let RewardDistributor: any;
  let rewardDistributor: Contract;
  let owner: Signer, addr1: Signer, addr2: Signer, addr3: Signer;
  let rewardToken: Contract;
  const distributionRate: number = 10; // replace with your desired distribution rate
  let merkleTree: MerkleTree, leaf: Buffer, proof: Buffer[];

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    
    // Generate a merkle tree for the test
    const testLeaves: Buffer[] = await Promise.all([owner, addr1, addr2, addr3].map(async address => keccak256(await address.getAddress())));

    merkleTree = new MerkleTree(testLeaves, keccak256);
    leaf = testLeaves[0];
    proof = merkleTree.getProof(leaf);

    const merkleRoot: string = '0x' + merkleTree.getRoot().toString('hex');

    // Deploy a mock ERC20 token for the reward
    const ERC20 = await ethers.getContractFactory('MyERC20');
    rewardToken = await ERC20.deploy('Mock Reward Token', 'MRT', ethers.parseEther('1000000'));
    await rewardToken.deployed();

    // Transfer tokens to the RewardDistributor contract
    await rewardToken.transfer(rewardDistributor.address, ethers.parseEther('1000000'));

    // Deploy the RewardDistributor contract
    RewardDistributor = await ethers.getContractFactory('GOTDistributor');
    rewardDistributor = await RewardDistributor.deploy(rewardToken.address, merkleRoot, distributionRate) as GOTDistributor;
    await rewardDistributor.deployed();
  });

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      expect(await rewardDistributor.owner()).to.equal(owner.getAddress());
    });

    it('Should set the right reward token', async function () {
      expect(await rewardDistributor.rewardToken()).to.equal(rewardToken.address);
    });

    it('Should set the right merkle root', async function () {
      expect(await rewardDistributor.merkleRoot()).to.equal('0x' + merkleTree.getRoot().toString('hex'));
    });
  });

  describe('claimReward', function () {
    it('Should fail if the merkle proof is invalid', async function () {
      await expect(rewardDistributor.connect(addr1).claimReward(10, [])).to.be.revertedWith('Invalid merkle proof');
    });

    it('Should succeed if the merkle proof is valid', async function () {
      const proofAsHex = proof.map(proofElement => ethers.hexlify(proofElement));
      await rewardDistributor.connect(addr1).claimReward(10, proofAsHex);
      // Add assertions to check the state after the claim
    });

    // Add more tests for different edge cases
  });

  // Add more tests for different edge cases
});
