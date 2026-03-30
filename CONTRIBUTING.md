# Contributing to MoltFi

Thank you for your interest in contributing to MoltFi! This document provides guidelines and instructions for contributing to this on-chain guardrails system for AI agent trading on Base.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Security](#security)
- [Areas for Contribution](#areas-for-contribution)

## Code of Conduct

This project and everyone participating in it is governed by our commitment to:

- **Security First**: All contributions must prioritize user fund safety
- **Respectful Communication**: Be kind, constructive, and professional
- **Collaborative Spirit**: Help others learn and grow
- **Transparency**: Document decisions and trade-offs clearly

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Git**: For version control
- **Node.js**: v20+ (as specified in `.node-version`)
- **Foundry**: For smart contract development
- **Base Sepolia ETH**: For testing (get from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-sepolia-faucet))

### Project Structure

```
moltfi/
├── app/              # Next.js app router
├── components/       # React components (shadcn/ui)
├── contracts/        # Solidity smart contracts
├── docs/             # Documentation
├── lib/              # Utility functions
├── skill/            # Agent skill files
├── src/contracts/    # Contract source files
└── public/           # Static assets
```

## Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/ortegarod/moltfi.git
cd moltfi
```

### 2. Install Node.js Dependencies

```bash
npm install
```

### 3. Install Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### 4. Set Up Environment Variables

```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

Required environment variables:
- `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`: WalletConnect project ID
- `VENICE_API_KEY`: Venice AI API key for natural language processing
- `BASE_SEPOLIA_RPC_URL`: Base Sepolia RPC endpoint
- `BASE_MAINNET_RPC_URL`: Base Mainnet RPC endpoint
- `PRIVATE_KEY`: For contract deployment (testnet only)

### 5. Build and Run

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## How to Contribute

### Reporting Issues

If you find a bug or have a suggestion:

1. **Check existing issues** to avoid duplicates
2. **Create a new issue** with:
   - Clear title and description
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - System information (OS, Node version, browser)
   - Screenshots if applicable
   - **Security issues**: See [Security](#security) section

### Submitting Pull Requests

1. **Fork the repository** and create your branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards

3. **Test your changes**:
   ```bash
   # Run Next.js tests
   npm test
   
   # Run smart contract tests
   cd contracts && forge test
   
   # Lint code
   npm run lint
   ```

4. **Commit with clear messages**:
   ```bash
   git commit -m "feat: add daily spending limit reset"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request** with:
   - Clear description of changes
   - Link to related issue(s)
   - Screenshots/demo for UI changes
   - Test results
   - Security considerations (if applicable)

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Build process or auxiliary tool changes
- `security:` Security-related changes

Example:
```
feat: implement multi-token vault support

- Add TokenRegistry contract
- Update AgentPolicy to track multiple tokens
- Add UI for token management
- Include tests for edge cases
```

## Coding Standards

### TypeScript/React

- Use TypeScript for all new files
- Follow ESLint and Prettier configuration
- Use functional components with hooks
- Follow existing component patterns (shadcn/ui)
- Add JSDoc comments for complex functions

Example:
```typescript
/**
 * Creates a new vault with specified spending limits
 * @param params - Vault creation parameters
 * @returns Transaction hash
 */
async function createVault(params: VaultParams): Promise<string> {
  // Implementation
}
```

### Solidity

- Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- Use OpenZeppelin contracts where possible
- Add comprehensive NatSpec documentation
- Include security considerations in comments
- Maximum line length: 120 characters

Example:
```solidity
/**
 * @notice Executes a trade within the agent's scoped limits
 * @dev Reverts if trade exceeds daily or per-trade limits
 * @param _tokenIn Token to swap from
 * @param _tokenOut Token to swap to
 * @param _amountIn Amount of input token
 * @return amountOut Amount of output token received
 */
function executeTrade(
    address _tokenIn,
    address _tokenOut,
    uint256 _amountIn
) external onlyRegisteredAgent returns (uint256 amountOut) {
    // Implementation
}
```

## Testing

### Smart Contract Tests

```bash
cd contracts

# Run all tests
forge test

# Run specific test
forge test --match-test testTradeExecution

# Run with gas report
forge test --gas-report

# Run with coverage
forge coverage
```

### Frontend Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests (if available)
npm run test:e2e
```

### Test Requirements

- All new features must include tests
- Smart contracts: >90% code coverage (security critical)
- Frontend: >70% code coverage
- Test edge cases and failure modes
- Include integration tests for agent workflows

## Security

### Reporting Security Issues

**DO NOT** create public issues for security vulnerabilities.

Instead:
1. Email security concerns to: [maintainer email]
2. Include detailed description and reproduction steps
3. Allow 48 hours for initial response
4. Coordinate disclosure timeline

### Security Best Practices

- Never commit private keys or sensitive data
- Use environment variables for secrets
- Follow [Consensys Smart Contract Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- Run Slither analysis: `slither contracts/`
- Run Mythril analysis: `mythril analyze contracts/AgentPolicy.sol`
- All state-changing functions must have access controls
- Validate all inputs and use SafeMath

## Areas for Contribution

### High Priority

1. **Security Enhancements**
   - Additional guardrail mechanisms
   - Emergency pause functionality
   - Multi-sig vault ownership
   - Time-locked parameter changes

2. **Agent Integration**
   - Additional AI model support
   - Better natural language parsing
   - Agent performance analytics
   - Multi-agent coordination

3. **Protocol Support**
   - Additional DEX integrations
   - Yield farming strategies
   - Cross-chain bridges
   - Lending protocol integration

### Medium Priority

4. **User Experience**
   - Mobile-responsive improvements
   - Transaction history visualization
   - Real-time notifications
   - Gas optimization suggestions

5. **Documentation**
   - API documentation
   - Video tutorials
   - Agent integration guides
   - Security best practices guide

6. **Developer Tools**
   - SDK for agent developers
   - CLI tools for vault management
   - Testing utilities
   - Local development environment

### Good First Issues

- Fix typos in documentation
- Add inline code comments
- Improve error messages
- Update dependencies
- Add TypeScript types
- Improve test coverage

## Questions?

- Check the [live demo](https://moltfi-production.up.railway.app)
- Review [ROADMAP.md](ROADMAP.md) for future plans
- Read [SUBMISSION.md](SUBMISSION.md) for hackathon context

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for helping build secure on-chain guardrails for AI agent trading! 🔒🤖