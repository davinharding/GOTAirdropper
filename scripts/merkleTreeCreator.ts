import axios from 'axios';
import { keccak256, bufferToHex, toBuffer } from 'ethereumjs-util';
import { MerkleTree } from 'merkletreejs';

interface StakeRecord {
  source: string;
}

interface StakeResponse {
  body: {
    holderRecords: StakeRecord[];
  };
}

async function getStakeByAddress(address: string): Promise<StakeResponse> {
  const response = await axios.get<StakeResponse>(`https://explorer.thetatoken.org:8443/api/stake/${address}`);
  // console.log('response.data.body', response.data.body)
  return response.data;
}

async function getStakedAddresses(nodeAddress: string): Promise<string[]> {
  const stakeData = await getStakeByAddress(nodeAddress);
  const stakedAddresses = stakeData.body.holderRecords.map(record => record.source);
  stakedAddresses.push('0x94538853Fd519B99964369fe84e6475d705A4454');
  stakedAddresses.push('0xA2D87d7E21F0f79222DB1b438e87220247A450f6');
  console.log('stakedAddresses', stakedAddresses);
  return stakedAddresses;
}

function createMerkleTree(addresses: string[]): MerkleTree {
  const leaves = addresses.map(address => keccak256(toBuffer(address)));
  const tree = new MerkleTree(leaves, keccak256, { sort: true });
  return tree;
}

async function main() {
  const nodeAddress = '0x104f8b65bf3fa313cc2998b2ab7319f9eca57089'; 
  const addresses = await getStakedAddresses(nodeAddress);
  const merkleTree = createMerkleTree(addresses);
  console.log('Root:', merkleTree.getHexRoot());
  console.log('Tree:', merkleTree);
}

main().catch(console.error);
