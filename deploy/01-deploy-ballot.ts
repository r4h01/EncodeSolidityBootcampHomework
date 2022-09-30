import { ethers } from "hardhat";
import { Ballot } from "../typechain-types";
import { DeployFunction } from "hardhat-deploy/types"
import { getNamedAccounts, deployments, network } from "hardhat"
const PROPOSALS = ["Proposal 1", "Proposal 2", "Proposal 3"];

function convertStringArrayToBytes32(array: string[]) {

  const bytes32Array = [];
  for (let index = 0; index < array.length; index++) {
    bytes32Array.push(ethers.utils.formatBytes32String(array[index]));
  }
  return bytes32Array;
}

const deployFunction: DeployFunction = async () => {

    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId: number | undefined = network.config.chainId

    let args = convertStringArrayToBytes32(PROPOSALS)

    await deploy(`Ballot`, {
      contract: `Ballot`,
      from: deployer,
      log: true,
      args: [args],
  })

}

export default deployFunction
deployFunction.tags = [`all`, `ballot`]

