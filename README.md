# ICO

# Project Description
This project aims to be used to raise ether through an ICO - the goal amount is set to 30,000 ether currently. There is a whitelisted, seed, general, and open phase. 
- Seed Phase: max total contribution limit of 15,000 ether and individual contribution limit of 1,500 ether
- General Phase: max total contribution limit of 30,000 ether (inclusive of the seed phase) and individual contribution limit of 1,000 ether
- Open Phase: no individual contribution limit. The goal is to raise 30,000 ether at this point

## Additional Details
- max supply of 500,000 tokens
- 2% tax on every transfer that gets put into a treasury account
- Owner can toggle this tax on/off

# How to run the project
- run "npm install" to install all dependencies
- the logic for implementing the ico is found in contracts/ico.sol
- test cases are found in test/ico_test.js and can be ran with the command "npx hardhat test"