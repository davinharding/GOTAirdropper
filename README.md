# GOT Airdropper

A gas-efficient reward distributor for the Guardian of Theta (GOT) token. Instead of pushing tokens to every staker, the contract stores a single **Merkle root** of eligible addresses, and each staker pulls their own reward with a proof.

Part of the **Theta Vibes / Guardian of Theta** project: [frontend](https://github.com/davinharding/guardian-of-theta-frontend) · [NFT staking contracts](https://github.com/davinharding/staking-guardian-of-theta) · [GOT reward airdropper](https://github.com/davinharding/GOTAirdropper)

## How it works

- **Merkle allowlist.** `scripts/merkleTreeCreator.ts` builds the tree from a list of eligible stakers; only the root goes on-chain.
- **Pull-based claims.** `claimReward(proof)` verifies the proof with OpenZeppelin's `MerkleProof` and pays out based on blocks elapsed since the caller's last claim (about one day of Theta blocks per period by default).
- **Owner controls.** Update the root, distribution rate, reward token, and claim wait time without redeploying; withdraw unused tokens.
- **Testable locally.** Ships with a `RewardToken` contract that mimics tokens minted by Theta's native token minter, so the whole flow runs in Hardhat.

## Run it

```bash
npm install
npx hardhat compile
npx hardhat test
```

Deploy scripts: `scripts/deployRewardToken.ts`, `scripts/deployGOTDistributor.ts`.

## Stack

Solidity 0.8 · Hardhat · TypeScript · OpenZeppelin (Ownable, MerkleProof)

---

<sub>Built by [Davin Harding](https://davin.io) · More at [github.com/davinharding](https://github.com/davinharding)</sub>
