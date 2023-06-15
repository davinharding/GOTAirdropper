// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract GOTDistributor {
    IERC20 public rewardToken;
    bytes32 public merkleRoot;
    uint256 public distributionRate;
    address public owner;
    mapping(address => uint256) public lastClaimed;

    event RewardPaid(address indexed user, uint256 amount);

    constructor(IERC20 _rewardToken, bytes32 _merkleRoot, uint256 _distributionRate) {
        rewardToken = _rewardToken;
        merkleRoot = _merkleRoot;
        distributionRate = _distributionRate;
        owner = msg.sender;
    }

    modifier onlyOwner {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    function updateMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
    }

    function updateDistributionRate(uint256 _distributionRate) external onlyOwner {
        distributionRate = _distributionRate;
    }

    function claimReward(uint256 amount, bytes32[] calldata merkleProof) external {
        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encodePacked(msg.sender, amount));
        require(MerkleProof.verify(merkleProof, merkleRoot, node), "Invalid merkle proof");

        // Calculate the number of days that have passed since the last claim.
        uint256 daysSinceLastClaim = (block.timestamp - lastClaimed[msg.sender]) / 1 days;

        // Ensure the user waits for at least a day between claims.
        require(daysSinceLastClaim > 0, "Must wait for a day before claiming again");

        // Calculate the reward amount.
        uint256 rewardAmount = amount * distributionRate * daysSinceLastClaim;

        // Ensure the contract has enough tokens to pay the reward.
        require(rewardToken.balanceOf(address(this)) >= rewardAmount, "Not enough tokens");

        // Transfer the reward to the user.
        rewardToken.transfer(msg.sender, rewardAmount);

        // Update the last claimed time.
        lastClaimed[msg.sender] = block.timestamp;

        emit RewardPaid(msg.sender, rewardAmount);
    }
}
