const { ethers } = require("hardhat");

async function main() {
  // the ico contract will create new instances of the coin and treasury
  const icoFactory = await ethers.getContractFactory("ICO");
  const ico = await icoFactory.deploy();
  console.log("ico deployed to: ", ico.address)

  // get treasury and coin addresses here
  console.log("spacecoin depoloyed to: ", await ico.token());
  console.log("treasury deployed to: ", await ico.treasury());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
