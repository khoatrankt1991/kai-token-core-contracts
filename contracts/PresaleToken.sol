// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract KAIPresale is Ownable, ReentrancyGuard {
    IERC20 public immutable kaiToken;
    address public immutable treasury;

    uint256 public constant TOKEN_DECIMALS = 1e18;
    uint256 public constant RATE = 300000; // 1 ETH = 300,000 KAI (~$0.01)
    uint256 public constant HARD_CAP = 1000 ether; // Max ETH to raise

    uint256 public totalETHRaised;
    bool public saleActive = true;

    event TokensPurchased(address indexed buyer, uint256 ethSpent, uint256 tokensReceived);
    event SaleEnded();

    constructor(address _kaiToken, address _treasury) Ownable(msg.sender) {
        require(_kaiToken != address(0), "Invalid token address");
        require(_treasury != address(0), "Invalid treasury address");
        kaiToken = IERC20(_kaiToken);
        treasury = _treasury;
    }

    receive() external payable {
        buyTokens();
    }

    function buyTokens() public payable nonReentrant {
        require(saleActive, "Presale has ended");
        require(msg.value > 0, "Send ETH to buy tokens");
        require(totalETHRaised + msg.value <= HARD_CAP, "Hard cap reached");

        uint256 tokensToReceive = msg.value * RATE;

        totalETHRaised += msg.value;

        (bool success, ) = treasury.call{value: msg.value}("");
        require(success, "ETH transfer failed");

        require(kaiToken.transfer(msg.sender, tokensToReceive), "Token transfer failed");

        emit TokensPurchased(msg.sender, msg.value, tokensToReceive);
    }

    function endSale() external onlyOwner {
        saleActive = false;
        emit SaleEnded();
    }

    function withdrawRemainingTokens(address to) external onlyOwner {
        require(!saleActive, "Sale still active");
        uint256 remaining = kaiToken.balanceOf(address(this));
        require(kaiToken.transfer(to, remaining), "Withdraw failed");
    }
}