import axios from 'axios';
import { keccak256, bufferToHex, toBuffer } from 'ethereumjs-util';
import { MerkleTree } from 'merkletreejs';

interface StakeRecord {
  source: string;
}

interface StakeResponse {
  body: {
    sourceRecords: StakeRecord[];
  };
}

async function getStakeByAddress(address: string): Promise<StakeResponse> {
  const response = await axios.get<StakeResponse>(`https://explorer.thetatoken.org:8443/api/stake/${address}`);
  return response.data;
}

async function getStakedAddresses(nodeAddress: string): Promise<string[]> {
  const stakeData = await getStakeByAddress(nodeAddress);
  const stakedAddresses = stakeData.body.sourceRecords.map(record => record.source);
  return stakedAddresses;
}

function createMerkleTree(addresses: string[]): MerkleTree {
  const leaves = addresses.map(address => keccak256(toBuffer(address)));
  const tree = new MerkleTree(leaves, keccak256);
  return tree;
}

async function main() {
  const nodeAddress = '0x104f8b65bf3fa313cc2998b2ab7319f9eca57089'; // replace with your node address
  const addresses = await getStakedAddresses(nodeAddress);
  const merkleTree = createMerkleTree(addresses);
  console.log('Root:', bufferToHex(merkleTree.getRoot()));
  console.log('Tree:', merkleTree);
}

main().catch(console.error);
