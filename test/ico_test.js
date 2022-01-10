const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = ethers;

describe("ICO contract", () => {
    let accounts;
    let icoFactory;
    let ico;
    let spaceCoinAddress;
    let spaceCoin;
    let treasuryAddress;
    let treasury;
  
    beforeEach(async () => {
      accounts = await ethers.getSigners();
      icoFactory = await ethers.getContractFactory("ICO");
      ico = await icoFactory.deploy()
      await ico.deployed()

      spaceCoinAddress = await ico.token();
      spaceCoin = await ethers.getContractAt(
        "SpaceCoin",
        spaceCoinAddress
      )

      treasuryAddress = await ico.treasury();
      treasury = await ethers.getContractAt(
        "Treasury",
        treasuryAddress
      )
    })
  
    it("should deploy the ico contract", async () => {
      expect(ico.address).to.exist
    })
  })