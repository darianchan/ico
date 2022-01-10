// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Coin.sol";
import "./Treasury.sol";
import "hardhat/console.sol";

contract ICO {
    address public creator;
    bool public taxOn;
    uint public goal = 30000 * 1 ether;
    uint public seedRaised;
    uint public generalRaised;
    uint public openRaised;
    uint public totalRaised;
    bool public isPaused;
    mapping (address => uint) public seedContributions;
    mapping (address => uint) public generalContributions;
    mapping (address => bool) public whitelisted;
    mapping (address => uint) public tokensAvailable;
    Treasury public treasury;
    SpaceCoin public token;
    
    enum Phases {
        NOTSTARTED,
        SEED,
        GENERAL,
        OPEN
    }

    Phases public phase = Phases.NOTSTARTED;

    // our max supply should be 500,000 total
    // have all 500,000 supply minted to this ICO contract
    constructor() {
        creator = msg.sender;
        token = new SpaceCoin();
        treasury = new Treasury();
        taxOn = true;
    }

    event Contribute(address indexed contributor, uint amount);
    event Mint(address indexed reciever, uint tokenAmount);
    event Whitelist(address indexed person);

    modifier onlyOwner() {
        require(msg.sender == creator);
        _;
    }

    modifier lessThanGoalRaised() {
        require(totalRaised <= goal);
        _;
    }

    modifier notPaused() {
        require(!isPaused);
        _;
    }

    function pause() public onlyOwner {
        isPaused = true;
    }

    function resume() public onlyOwner {
        isPaused = false;
    }

    function nextPhase() public onlyOwner{
        phase = Phases(uint(phase) + 1);
    }

    function currentPhase() public view returns (Phases) {
        if (phase == Phases.NOTSTARTED) {
            return Phases.NOTSTARTED;
        }
        if (phase == Phases.SEED) {
            return Phases.SEED;
        }
        else if (phase == Phases.GENERAL) {
            return Phases.GENERAL;
        }
        else if (phase == Phases.OPEN) {
            return Phases.OPEN;
        }
    }

    function enableTax() public onlyOwner {
        taxOn = true;
    }

    function disableTax() public onlyOwner {
        taxOn = false;
    }

    // not optimal in reality bc owner will have to call this function everytime to add someone to the whitelist
    function whitelist(address _person) public onlyOwner {
        require(currentPhase() == Phases.SEED || currentPhase() == Phases.NOTSTARTED);
        whitelisted[_person] = true;

        emit Whitelist(_person);
    }

    function contribute() public payable notPaused lessThanGoalRaised {
        require(currentPhase() != Phases.NOTSTARTED, "The ICO has not started yet");
        uint tokens; // needs to be multiplied by 10**18 before transferring out
        tokens = msg.value / 1 ether * 5;
        totalRaised += msg.value;
        
        if (currentPhase() == Phases.SEED) {
            checkSeed(msg.sender, msg.value);
            seedContributions[msg.sender] += msg.value;
            tokensAvailable[msg.sender] += tokens;

        } else if (currentPhase() == Phases.GENERAL) {            
            checkGeneral(msg.sender, msg.value);
            generalContributions[msg.sender] += msg.value;
            tokensAvailable[msg.sender] += tokens;

        } else if (currentPhase() == Phases.OPEN) {
            require(totalRaised + msg.value <= 30000 * 1 ether);
            tokensAvailable[msg.sender] += tokens;
        }

        emit Contribute(msg.sender, msg.value);
    }

    function checkSeed(address contributor, uint amount) private view {
        require(whitelisted[msg.sender], "Not on whitelist");
        require((seedContributions[contributor] + amount) <= 1500 * 1 ether, "exceed individual contribution limit for seed");
        require(totalRaised + amount <= 15000 * 1 ether, "exceed contribution limit for seed phase");
    }

    function checkGeneral(address contributor, uint amount) private view {
        require((generalContributions[contributor] + (amount)) <= 1000 * 1 ether, "exceed individual contribution limit for general");
        require(totalRaised + amount <= 30000 * 1 ether, "exceed contribution limit for general phase");
    }

    function sendTax(uint _tokenAmount) private {
        require(taxOn);
        uint taxAmount =  (_tokenAmount * 2) / 100; // error in rouding down division
        (bool success) = token.transfer(address(treasury), taxAmount * 10**18);
        require(success, "could not send tax");
    }

    function mint(uint _tokenAmount) public {
        require(currentPhase() == Phases.OPEN);
        require(tokensAvailable[msg.sender] >= _tokenAmount);
        require(token.balanceOf(address(this)) >= _tokenAmount); // require ico has enough spacecoin tokens to send
        tokensAvailable[msg.sender] -= _tokenAmount;

        
        if (taxOn) {
            (bool success) = token.transfer(msg.sender, (_tokenAmount * 98/100) * 10**18); 
            require(success);
            sendTax(_tokenAmount);
        } else {
            (bool success) = token.transfer(msg.sender, _tokenAmount * 10**18);
            require(success);
        }

        emit Mint(msg.sender, _tokenAmount);
    }

    // make it require that the goal is raised to withdraw?
    function withdraw() public onlyOwner {
        (bool success, ) = creator.call{value: totalRaised}("");
        require(success);
    }
}