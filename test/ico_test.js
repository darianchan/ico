const { expect } = require("chai");
const { ethers, waffle} = require("hardhat");
const provider = waffle.provider;
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

    it("should deploy the treausry contract", async() => {
      expect(treasury.address).to.exist;
    })

    it("should deploy the spaceCoin contract", async() => {
      expect(spaceCoin.address).to.exist;
    })

    describe("toggle pause, resume and next phase of ico", () => {
      it("should let the owner pause the ico", async() => {
        await ico.pause()
        expect(await ico.isPaused()).to.be.true;
      })

      it("should let the owner resume the ico after it is paused", async() => {
        await ico.pause();
        await ico.resume();
        expect(await ico.isPaused()).to.be.false;
      })

      it("should let the owner move to the next phase of the ico", async() => {
        let firstPhase = await ico.currentPhase();
        await ico.nextPhase();
        let secondPhase = await ico.currentPhase();
        expect(firstPhase).to.not.eq(secondPhase);
      })
    })

    describe("tax", () => {
      it("should let the owner turn on tax", async() => {
        await ico.enableTax();
        expect(await ico.taxOn()).to.be.true;
      })

      it("should let the owner turn off tax after it has been turned on", async() => {
        await ico.enableTax();
        await ico.disableTax();
        expect(await ico.taxOn()).to.be.false;
      })
    })

    describe("contribute", () => {
      describe("seed phase", () => {
        beforeEach(async () => {
          await ico.nextPhase()
        })

        it("should allow a whitelisted user to contribute to the seed phase", async() => {
          // whitelist accounts 1 and 2 
          await ico.whitelist([accounts[1].address, accounts[2].address]);
          await ico.connect(accounts[1]).contribute({value: ethers.utils.parseEther("1")})
          await ico.connect(accounts[2]).contribute({value: ethers.utils.parseEther("1")})
          let totalRaised = ethers.utils.formatEther(await ico.totalRaised())
          expect(totalRaised).to.eq('2.0')
        })

        it("should revert if a non-whitelisted user tries to contribute during the seed phase", async() => {
          await expect(ico.connect(accounts[1]).contribute({value: ethers.utils.parseEther("1")})).to.be.reverted;
        })

        it("should have an individual contribution limit of 1500 eth for the seed phase", async() => {
          await ico.whitelist([accounts[1].address]);
          await expect(ico.connect(accounts[1]).contribute({value: ethers.utils.parseEther("1501")})).to.be.reverted
        })
      })

      describe("general phase", () => {
          beforeEach(async () => {
            // move to general phase
            await ico.nextPhase();
            await ico.nextPhase();
          })

        it("should allow anyone to contribute", async() => {
          await ico.connect(accounts[1]).contribute({value: ethers.utils.parseEther("1")});
          let totalRaised = ethers.utils.formatEther(await ico.totalRaised());
          expect(totalRaised).to.eq('1.0');
        })

        it("should have an individual contribution limit of 1000 eth for the general phase", async() => {
          await expect(ico.connect(accounts[1]).contribute({value: ethers.utils.parseEther("1001")})).to.be.reverted
        })

        it("should send a 2% tax to the treasury if tax is on", async() => {
          await ico.nextPhase(); // change it to open phase
          await ico.enableTax();
          await ico.connect(accounts[1]).contribute({value: ethers.utils.parseEther("10")})
          await ico.connect(accounts[1]).mint(50);
          let userBalance = ethers.utils.formatEther(await spaceCoin.balanceOf(accounts[1].address))
          console.log(ethers.utils.formatEther(await spaceCoin.balanceOf(treasury.address)))
          expect(userBalance).to.eq("49.0")
        })

        it("should not send a 2% tax to the treasury if tax is off", async() => {
          await ico.nextPhase(); // change it to open phase
          await ico.disableTax();
          await ico.connect(accounts[1]).contribute({value: ethers.utils.parseEther("10")})
          await ico.connect(accounts[1]).mint(50);
          let userBalance = ethers.utils.formatEther(await spaceCoin.balanceOf(accounts[1].address))
          expect(userBalance).to.eq("50.0")
        })

        it("should revert if a user tries to claim more tokens than they are supposed to", async() => {
          await ico.nextPhase(); // change it to open phase
          await ico.connect(accounts[1]).contribute({value: ethers.utils.parseEther("10")})
          await expect(ico.connect(accounts[1]).mint(500)).to.be.reverted;
        })
      })

      describe("withdraw", () => {
        it("should allow the owner to withdraw funds", async() => {
          // move to open phase
          await ico.nextPhase()
          await ico.nextPhase()
          await ico.nextPhase()

          await ico.connect(accounts[1]).contribute({value: ethers.utils.parseEther("1")});
          let ownerInitialBalance = ethers.utils.formatEther(await provider.getBalance(accounts[0].address))
          await ico.withdraw();
          let ownerBalance = ethers.utils.formatEther(await provider.getBalance(accounts[0].address))
          expect(ownerInitialBalance).to.not.eq(ownerBalance)
        })
      })
    })
  })