# Contributing to MoltFi

Thank you for your interest in contributing to MoltFi! This document provides guidelines and instructions for contributing to this on-chain guardrails protocol for AI agent trading on Base.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Contributing Guidelines](#contributing-guidelines)
- [Smart Contract Development](#smart-contract-development)
- [Frontend Development](#frontend-development)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Security](#security)
- [Community](#community)

## Code of Conduct

By participating in this project, you agree to:

- Be respectful and constructive in all interactions
- Focus on what's best for the security and usability of the protocol
- Accept constructive criticism gracefully
- Show empathy towards other community members

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js** (v18 or higher)
- **Git** for version control
- **MetaMask** or another Web3 wallet
- **Base network** configured in your wallet
- Basic understanding of:
  - Solidity smart contracts
  - Next.js/React for frontend
  - Hardhat or Foundry for contract development
  - Uniswap V3 integration

### Knowledge Requirements

Familiarity with these concepts is helpful:

- Smart contract access control patterns
- DeFi protocols (Uniswap V3, Lido)
- AI agent integration patterns
- Venice AI or similar LLM APIs

## Development Setup

### 1. Fork and Clone

```bash
git clone https://github.com/YOUR_USERNAME/moltfi.git
cd moltfi
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file:

```env
# Required for local development
NEXT_PUBLIC_DEFAULT_CHAIN=sepolia

# Optional: For contract deployment (maintainers only)
PRIVATE_KEY=your_private_key_here
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
VENICE_API_KEY=your_venice_api_key_here
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the app.

## Project Structure

```
moltfi/
├── app/                    # Next.js app router pages
├── components/             # React components
│   ├── ui/                # UI components (buttons, inputs)
│   └── ...                # Feature components
├── contracts/              # Smart contract source code
│   ├── AgentGuardRouter.sol
│   ├── VaultFactory.sol
│   └── ...
├── src/                    # Utility functions and hooks
│   ├── lib/               # Utility libraries
│   └── ...
├── skill/                  # AI agent skill definitions
├── docs/                   # Documentation
│   └── screenshot.png
├── lib/                    # Third-party libraries
├── public/                 # Static assets
├── next.config.ts          # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
└── railway.json            # Railway deployment config
```

## Contributing Guidelines

### Types of Contributions

We welcome:

1. **Bug Fixes**: Fix issues in smart contracts or frontend
2. **Security Improvements**: Enhance contract security, add validation
3. **Feature Enhancements**: New trading policies, UI improvements
4. **Documentation**: Improve README, add guides, code comments
5. **Testing**: Add test coverage for contracts and API endpoints
6. **Agent Integrations**: New skill files for AI agent frameworks

### Smart Contract Changes

When modifying contracts in `/contracts`:

1. **Security first**: All changes must prioritize security
2. **Add tests**: Write comprehensive tests for new functionality
3. **Gas optimization**: Consider gas costs for on-chain operations
4. **Documentation**: Update contract documentation and deployment addresses
5. **Review**: All contract changes require maintainer review

### Frontend Changes

When modifying the Next.js app:

1. **Responsive design**: Ensure mobile and desktop compatibility
2. **Wallet compatibility**: Test with multiple wallet providers
3. **Error handling**: Handle Web3 errors gracefully
4. **Accessibility**: Use semantic HTML and ARIA labels
5. **Performance**: Optimize for fast load times

### API Changes

When modifying API routes in `/app/api`:

1. **Validation**: Validate all inputs thoroughly
2. **Error responses**: Return clear error messages
3. **Rate limiting**: Consider adding rate limits for public endpoints
4. **Documentation**: Update API documentation in README

## Smart Contract Development

### Contract Architecture

MoltFi uses a guardrail pattern:

```
User Vault → AgentGuardRouter → Uniswap V3
     ↑              ↑
  Policy      Limit Checks
```

Key contracts:
- **VaultFactory**: Creates user vaults
- **AgentGuardRouter**: Enforces trading limits
- **AgentPolicy**: Stores and validates policies

### Local Contract Testing

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Run tests with coverage
npx hardhat coverage
```

### Contract Deployment

**Note**: Only maintainers deploy to mainnet.

For testnet deployment:

```bash
# Deploy to Base Sepolia
npx hardhat run scripts/deploy.js --network baseSepolia
```

## Frontend Development

### Component Guidelines

- Use **TypeScript** for all components
- Use **Tailwind CSS** for styling
- Place reusable UI components in `/components/ui`
- Use **shadcn/ui** patterns for consistency

### Web3 Integration

- Use **wagmi** for wallet connections
- Use **viem** for contract interactions
- Handle chain switching gracefully

### Example Component

```tsx
// components/VaultStatus.tsx
import { useAccount, useReadContract } from 'wagmi'
import { vaultABI } from '@/src/lib/abis'

export function VaultStatus({ vaultAddress }: { vaultAddress: string }) {
  const { address } = useAccount()
  
  const { data: balance } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: vaultABI,
    functionName: 'getBalance',
    args: [address]
  })
  
  return (
    <div className="p-4 border rounded">
      <h3>Vault Balance</h3>
      <p>{balance ? formatEther(balance) : '0'} ETH</p>
    </div>
  )
}
```

## Testing

### Contract Tests

```bash
# Run all contract tests
npx hardhat test

# Run specific test file
npx hardhat test test/AgentGuardRouter.test.js

# Run with gas report
REPORT_GAS=true npx hardhat test
```

### Frontend Tests

```bash
# Run Jest tests
npm test

# Run with coverage
npm test -- --coverage
```

### Integration Testing

Test the full flow on Base Sepolia:

1. Create a vault
2. Set trading policies
3. Register an agent
4. Execute a trade within limits
5. Verify limit enforcement

## Submitting Changes

### Pull Request Process

1. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes** following the guidelines above

3. **Test thoroughly**:
   ```bash
   npm test
   npx hardhat test
   ```

4. **Commit with clear messages**:
   ```bash
   git commit -m "feat: add daily spending cap reset notification"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**:
   - Use a clear title and description
   - Reference any related issues
   - Include screenshots for UI changes
   - List what was tested

### Commit Message Format

We follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style (formatting)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Build process, dependencies
- `security:` Security-related changes

Examples:
```
feat: add support for multi-token vaults
fix: correct daily cap calculation across timezones
security: add reentrancy guard to executeSwap
```

## Security

### Security Checklist

Before submitting:

- [ ] No hardcoded private keys or API keys
- [ ] Input validation on all user inputs
- [ ] Reentrancy protection for external calls
- [ ] Access control for admin functions
- [ ] Events emitted for state changes
- [ ] No storage collision in upgradeable contracts

### Reporting Security Issues

**DO NOT** open public issues for security vulnerabilities.

Instead:
1. Email security concerns to maintainers privately
2. Allow time for assessment and fix
3. Coordinate responsible disclosure

## Agent Skill Contributions

To add support for a new AI agent framework:

1. Create a skill file in `/skill/`
2. Follow the existing skill file format
3. Test with the actual agent framework
4. Document the integration

Example skill file structure:
```json
{
  "name": "moltfi-trading",
  "description": "Trade crypto with on-chain guardrails",
  "endpoints": {
    "register": "https://moltfi-production.up.railway.app/api/agent/register",
    "trade": "https://moltfi-production.up.railway.app/api/agent"
  }
}
```

## Community

### Getting Help

- **GitHub Issues**: Bug reports and feature requests
- **Live Demo**: Try the app at [moltfi-production.up.railway.app](https://moltfi-production.up.railway.app)
- **Documentation**: Check the README and ROADMAP.md

### Resources

- [Base Documentation](https://docs.base.org)
- [Uniswap V3 Docs](https://docs.uniswap.org/contracts/v3)
- [Venice AI Docs](https://venice.ai/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## Recognition

Contributors will be recognized in:
- Release notes
- README contributors section
- Project documentation

Thank you for helping make AI agent trading safer! 🔒
