// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GOTDistributor is Ownable {
    IERC20 public rewardToken;
    uint256 public distributionRate;
    uint256 public contractBirth;
    uint256 public claimWaitTimeInBlocks;
    mapping(address => uint256) public lastClaimed;
    mapping(address => uint256) public amountStaked;

    event RewardPaid(address indexed user, uint256 amount);
    event TokensWithdrawn(address indexed owner, uint256 amount);

    constructor(IERC20 _rewardToken, uint256 _distributionRate) {
        rewardToken = _rewardToken;
        distributionRate = _distributionRate;
        contractBirth = block.number;
        claimWaitTimeInBlocks = 13900; // roughly one day in blocks on theta chain
    } 

    function updateDistributionRate(uint256 _distributionRate) external onlyOwner {
        distributionRate = _distributionRate;
    }

    function updateRewardToken(IERC20 _rewardTokenAddress) external onlyOwner {
        rewardToken = _rewardTokenAddress;
    }

    function updateClaimWaitTimeInBlocks(uint256 _claimWaitTimeInBlocks) external onlyOwner {
        claimWaitTimeInBlocks = _claimWaitTimeInBlocks;
    }

    function updateAmountStaked(address[] calldata sources, uint256[] calldata amounts) external onlyOwner {
        require(sources.length == amounts.length, "Arrays must have equal length");

        for (uint256 i = 0; i < sources.length; i++) {
            amountStaked[sources[i]] = amounts[i];
        }
    }

    function claimReward() external {
        // Check if the sender has staked
        require(amountStaked[msg.sender] > 0, "No staked amount found for the sender");

        // Calculate the number of days that have passed since the last claim.
        if (lastClaimed[msg.sender] == 0) {
            lastClaimed[msg.sender] = block.number - claimWaitTimeInBlocks; // set towards current block number minus claimWaitTimeInBlocks so that the first time they claim they can only claim up to 10 GOT
        }
        uint256 daysSinceLastClaim = (block.number - lastClaimed[msg.sender]) * 1e18 / claimWaitTimeInBlocks; // * 1e18 to allow for fractions of a day 
        // Ensure the user waits for at least a day between claims.
        require(daysSinceLastClaim >= 1e18, "Must wait for a day before claiming");      

        // Calculate the reward amount.
        uint256 rewardAmount = (distributionRate) * daysSinceLastClaim * amountStaked[msg.sender]; // convert eth value to wei and multiply by daysSinceLastClaim

        // Ensure the contract has enough tokens to pay the reward.
        require(rewardToken.balanceOf(address(this)) >= rewardAmount, "Not enough tokens");

        // Transfer the reward to the user.
        rewardToken.transfer(msg.sender, rewardAmount);

        // Update the last claimed time.
        lastClaimed[msg.sender] = block.number;

        // emit RewardPaid event with recipient and amount.
        emit RewardPaid(msg.sender, rewardAmount);
    }

    function withdrawTokens(uint256 amount) external onlyOwner {
        uint256 balance = rewardToken.balanceOf(address(this));
        require(balance >= amount, "Insufficient tokens in contract");
        rewardToken.transfer(owner(), amount);
        emit TokensWithdrawn(owner(), amount);
    }
}
