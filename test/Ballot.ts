import { expect } from "chai";
import { ethers, getNamedAccounts } from "hardhat";
import { Ballot } from "../typechain-types";
const PROPOSALS = ["Proposal 1", "Proposal 2", "Proposal 3"];

function convertStringArrayToBytes32(array: string[]) {
  const bytes32Array = []

  for (let index = 0; index < array.length; index++) {
    bytes32Array.push(ethers.utils.formatBytes32String(array[index]));
  }
  return bytes32Array;
}

describe("Ballot", function () {
  let ballotContract: Ballot
  let deployer: string
  let voter: string

  const newVoter = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"

  beforeEach(async function () {
    deployer = (await getNamedAccounts()).deployer
    voter = (await getNamedAccounts()).voter
    const ballotFactory = await ethers.getContractFactory("Ballot");
    ballotContract = await ballotFactory.deploy(
      convertStringArrayToBytes32(PROPOSALS)
    );
    await ballotContract.deployed();
  });

  describe("when the contract is deployed", function () {
    it("has the provided proposals", async function () {
      for (let index = 0; index < PROPOSALS.length; index++) {
        const proposal = await ballotContract.proposals(index);
        expect(ethers.utils.parseBytes32String(proposal.name)).to.eq(
          PROPOSALS[index]
        );
      }
    });

    it("has zero votes for all proposals", async function () {
      for (let index = 0; index < PROPOSALS.length; index++) {
        const proposal = await ballotContract.proposals(index);
        expect(proposal.voteCount).to.eq(
          0
        );
      }
    });

    it("sets the deployer address as chairperson", async function () {
      const owner = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
      const chairperson = await ballotContract.chairperson()
      expect(chairperson.toString()).to.eq(owner)
    });

    it("sets the voting weight for the chairperson as 1", async function () {
      const chairperson = await ballotContract.chairperson()
      const votingWeight = await ballotContract.voters(chairperson)
      expect(votingWeight.weight).to.eq(1)
    });
  });

  describe("when the chairperson interacts with the giveRightToVote function in the contract", function () {

    it("gives right to vote for another address", async function () {

      const rightToVote = await ballotContract.giveRightToVote(voter)
      const votingWeight = await ballotContract.voters(voter)
      expect(votingWeight.weight).to.eq(1)
    });

    it("can not give right to vote for someone that has voted", async function () {
      const accounts = await ethers.getSigners()
      const rightToVote = await ballotContract.giveRightToVote(accounts[1].address)
      const voteTx = await ballotContract.connect(accounts[1]).vote(1)
      const voterProp = await ballotContract.voters(voter)
      await expect(ballotContract.giveRightToVote(newVoter)).to.be.revertedWith("The voter already voted.")

    });
    it("can not give right to vote for someone that has already voting rights", async function () {
      const accounts = await ethers.getSigners()
      const rightToVote = await ballotContract.giveRightToVote(accounts[1].address)
      await expect(ballotContract.giveRightToVote(accounts[1].address)).to.be.reverted
    });
  });

  describe("when the voter interact with the vote function in the contract", function () {

    it("should register the vote", async () => {
      let proposalBeforeVoting = []
      for (let index = 0; index < PROPOSALS.length; index++) {
        const proposal = await ballotContract.proposals(index);
        proposalBeforeVoting.push({
          name: ethers.utils.parseBytes32String(proposal.name),
          vote: proposal.voteCount.toString()
        })
      }
      let voteProposal1 = await ballotContract.vote(1)
      let proposal1 = await ballotContract.proposals(1);
      expect(proposal1.voteCount.toString()).not.to.be.eq(proposalBeforeVoting[0].vote)
      expect(proposal1.voteCount).to.be.eq(1)

    });
  });

  describe("when the voter interact with the delegate function in the contract", function () {

    it("should transfer voting power", async () => {
      const accounts = await ethers.getSigners()
      const voter1 = accounts[1]
      const voter2 = accounts[2]
      const rightToVoteVoter1 = await ballotContract.giveRightToVote(voter1.address)
      const rightToVoteVoter2 = await ballotContract.giveRightToVote(voter2.address)
      const delegateVote = await ballotContract.delegate(voter2.address)
      const voteTx = await ballotContract.connect(voter2).vote(1)
      let proposal1 = await ballotContract.proposals(1)
      expect(proposal1.voteCount).to.be.eq(2)

    });
  });

  describe("when the an attacker interact with the giveRightToVote function in the contract", function () {
    
    it("should revert when attacker calls giveRightToVote", async () => {
      const accounts = await ethers.getSigners()
      const attacker = accounts[1]
      await expect(ballotContract.connect(attacker).giveRightToVote(accounts[2].address)).to.be.revertedWith('Only chairperson can give right to vote.')
    });
  });

  describe("when the an attacker interact with the vote function in the contract", function () {
    
    it("should revert when attackers calls vote", async () => {
      const accounts = await ethers.getSigners()
      const attacker = accounts[1]
      await expect(ballotContract.connect(attacker).vote(1)).to.be.revertedWith('Has no right to vote')
    });
  });

  describe("when the an attacker interact with the delegate function in the contract", function () {
    // TODO
    it("should revert when attacker interact with the delegate function", async () => {
      const accounts = await ethers.getSigners()
      const attacker = accounts[1]
      await expect(ballotContract.connect(attacker).delegate(accounts[2].address)).to.be.revertedWith('You have no right to vote')
    });
  });

  describe("when someone interact with the winningProposal function before any votes are cast", function () {
    
    it("should return 0", async () => {
      const winningPoposal = await ballotContract.winningProposal()
      expect(winningPoposal).to.be.eq(0)
    });
  });

  describe("when someone interact with the winningProposal function after one vote is cast for the first proposal", function () {
     
    it("should return 0", async () => {
      const accounts = await ethers.getSigners()
      const voter1 = accounts[1]
      const rightToVoteVoter1 = await ballotContract.giveRightToVote(voter1.address)
      const vote = await ballotContract.connect(voter1).vote(0)
      const winningPoposal = await ballotContract.winningProposal()
      expect(winningPoposal).to.be.eq(0)
    });
  });

  describe("when someone interact with the winnerName function before any votes are cast", function () {
    
    it("should return name of proposal 0", async () => {
      const winnerName = await ballotContract.winnerName()
      expect(ethers.utils.parseBytes32String(winnerName)).to.be.eq("Proposal 1")
    });
  });

  describe("when someone interact with the winnerName function after one vote is cast for the first proposal", function () {
    
    it("should return name of proposal 0", async () => {
      const accounts = await ethers.getSigners()
      const voter1 = accounts[1]
      const rightToVoteVoter1 = await ballotContract.giveRightToVote(voter1.address)
      const vote = await ballotContract.connect(voter1).vote(0)
      const winnerName = await ballotContract.winnerName()
      expect(ethers.utils.parseBytes32String(winnerName)).to.be.eq("Proposal 1")
    });
  });

  describe("when someone interact with the winningProposal function and winnerName after 5 random votes are cast for the proposals", function () {
    
    it("should return the name of the winner proposal", async () => {
      const accounts = await ethers.getSigners()
      let rightToVoteVoters
      for (let index = 1; index < 7; index++) {
        rightToVoteVoters = await ballotContract.giveRightToVote(accounts[index].address)
        const vote = await ballotContract.connect(accounts[index]).vote(2)
      }
      const winningPoposal = await ballotContract.winningProposal()
      const winnerName = await ballotContract.winnerName()
      expect(winningPoposal).to.be.eq(2)
      expect(ethers.utils.parseBytes32String(winnerName)).to.be.eq("Proposal 3")
      
    });
  });
});