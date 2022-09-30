import { ethers } from "hardhat";
import { Ballot } from "../typechain-types";
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
const PROPOSALS = ["Proposal 1", "Proposal 2", "Proposal 3"];

async function main() {
  function convertStringArrayToBytes32(array: string[]) {
    const bytes32Array = [];
    for (let index = 0; index < array.length; index++) {
      bytes32Array.push(ethers.utils.formatBytes32String(array[index]));
    }
    return bytes32Array;
  }
  let ballotContract: Ballot;

  const ballotFactory = await ethers.getContractFactory("Ballot");
  ballotContract = await ballotFactory.deploy(
    convertStringArrayToBytes32(PROPOSALS)
  );
  await ballotContract.deployed();

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});