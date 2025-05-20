# 💰 KaiToken Core Contracts

Smart contracts powering **KaiToken (ERC-20)** and related Web3 utilities, including:

- 🔹 Token presale with whitelist and cap
- 🔹 Staking system with flexible & fixed plans
- 🔹 **Permit support (EIP-2612)** for gas-optimized staking

Built with Solidity, Hardhat, and optimized for UX.

---

## ✨ Features

### ✅ ERC-20 Token (KaiToken)
- Based on OpenZeppelin ERC20
- Supports **EIP-2612 Permit**
- Mintable by owner (for presale or rewards)

### 🚀 Presale
- Whitelist support (optional)
- Configurable cap, deadline, and accepted token
- Emits purchase events for indexing (The Graph-ready)

### 🪙 Staking
- **Flexible plan**: unstake anytime, linear reward
- **30-day lock plan**: higher fixed APY
- Reward source: KaiToken balance or emission
- ✅ **Supports `stakeWithPermit(...)`** for 1-tx staking (skip `approve()`)

---

## 🚀 One-Tx UX with Permit

KaiToken implements [EIP-2612](https://eips.ethereum.org/EIPS/eip-2612), allowing users to stake without needing an `approve()` transaction.

```ts
// Example: Stake with permit (frontend)
const signature = signTypedPermit(owner, spender, value, deadline);
stakingContract.stakeWithPermit(value, deadline, v, r, s);


## Smart Contracts

### 1. KAI Token (KAI.sol)
- ERC20 token with features:
  - Permit (ERC20Permit) for gasless approvals
  - Burnable for token burning
  - Ownable with minting rights
- Total Supply: 1,000,000,000 KAI
- Decimals: 18

### 2. Presale Contract (KAIPresale.sol)
- Manages token presale event
- Features:
  - Rate: 1 ETH = 300,000 KAI
  - Hard cap: 1000 ETH
  - Automatic ETH transfer to treasury
  - Owner can end sale and withdraw remaining tokens
- Security:
  - ReentrancyGuard
  - Address validation
  - ETH amount checks

### 3. Staking Reward (StakingReward.sol)
- Staking system with 3 plans:
  1. Flexible: 15% APY
  2. 30 days: 25% APY
  3. 180 days: 60% APY
- Features:
  - Stake with permit
  - Claim rewards for flexible staking
  - Unstake after lock period
  - Minimum 1 KAI to claim rewards
- Security:
  - ReentrancyGuard
  - Lock period validation
  - Reward amount checks

## Contract Addresses

| Network   | KAI Token Address                                   | PresaleToken Address                              | Staking Reward Address                             |
|-----------|-----------------------------------------------------|---------------------------------------------------|----------------------------------------------------|
| Mainnet   |                                                     |                                                   |                                                    |
| Sepolia   | [0x7D98DF6357b07A3c0deDF849fD829f7296b818F5](https://sepolia.etherscan.io/address/0x7D98DF6357b07A3c0deDF849fD829f7296b818F5)          | [0x641A10285b1110001D6475D19395Adcfa64E5260](https://sepolia.etherscan.io/address/0x641A10285b1110001D6475D19395Adcfa64E5260)        | [0x3cfECcF7379fdb424BB42D258fa10e63F1b0CC59](https://sepolia.etherscan.io/address/0x3cfECcF7379fdb424BB42D258fa10e63F1b0CC59)         |

## Installation

```bash
# Clone repository
git clone [repository-url]

# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test
```

## Environment

Create `.env` file with the following variables:
```
AICHEMY_KEY=your_alchemy_key
ACCOUNT_PRIVATE_KEY=your_private_key
ETHERSCAN_API_KEY=your_etherscan_key
TREASURY_ADDRESS=your_treasury_address
```

## Deployment

```bash
# Deploy KAI Token
npx hardhat run deploy/01_deploy_permit_token.ts --network [network]

# Deploy Presale
npx hardhat run deploy/02_deploy_presale_token.ts --network [network]
```

## Contract Verification

```bash
# Verify KAI Token
npx hardhat verify --network [network] [deployed-address]

# Verify Presale
npx hardhat verify --network [network] [deployed-address] [kai-token-address] [treasury-address]
```

## Testing

```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/KaiToken.ts
npx hardhat test test/KaiPresaleToken.ts
npx hardhat test test/KaiTokenStaking.ts
```

## Contract Usage Examples

### KAI Token
```solidity
// Mint new tokens
function mint(address to, uint256 amount) external onlyOwner

// Burn tokens
function burn(uint256 amount) external

// Permit approval
function permit(
    address owner,
    address spender,
    uint256 value,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
) external
```

### Presale
```solidity
// Buy tokens with ETH
function buyTokens() external payable

// End presale
function endSale() external onlyOwner

// Withdraw remaining tokens
function withdrawRemainingTokens(address to) external onlyOwner
```

### Staking
```solidity
// Stake tokens
function stake(uint256 amount, uint256 planId) external

// Claim rewards (flexible staking only)
function claim(uint256 index) external

// Unstake tokens
function unstake(uint256 index) external

// Stake with permit
function stakeWithPermit(
    uint256 amount,
    uint256 planId,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
) external
```

## Security

- All contracts use OpenZeppelin's battle-tested contracts
- ReentrancyGuard implemented for critical functions
- Access control with Ownable
- Input validation for all parameters
- Minimum reward threshold for claims

## License

MIT
