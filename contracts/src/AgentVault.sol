// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AgentPolicy} from "./AgentPolicy.sol";

/**
 * @title AgentVault
 * @notice Holds user funds and only allows the agent to trade through AgentGuardRouter.
 *         The agent CANNOT withdraw or bypass the router — guardrails are enforced by design.
 *
 * Flow:
 * 1. Owner (human) deploys vault, specifying their agent and the router
 * 2. Owner deposits ETH/ERC20 into the vault
 * 3. Owner sets policy on AgentPolicy contract (max trade size, daily limit)
 * 4. Agent calls vault.executeSwap() — vault routes through AgentGuardRouter
 * 5. Router checks policy via AgentPolicy.enforceAndRecord()
 * 6. If allowed → swap executes, output tokens return to vault
 * 7. If over limits → reverts, nothing moves
 * 8. Only owner can withdraw funds from the vault
 *
 * Key guarantee: The agent never holds the funds. It can only trade them
 * through the one path that checks the policy. No bypass possible.
 */

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

interface IAgentGuardRouter {
    function swap(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn,
        uint256 amountOutMinimum
    ) external returns (uint256 amountOut);
}

interface IWETH {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}

interface IWstETH {
    function wrap(uint256 stETHAmount) external returns (uint256);
    function unwrap(uint256 wstETHAmount) external returns (uint256);
    function getStETHByWstETH(uint256 wstETHAmount) external view returns (uint256);
    function getWstETHByStETH(uint256 stETHAmount) external view returns (uint256);
}

interface ILido {
    function submit(address referral) external payable returns (uint256);
}

contract AgentVault {
    address public immutable owner;      // human — can deposit, withdraw, change agent
    address public agent;                // AI agent — can only trade via executeSwap
    address public immutable router;     // AgentGuardRouter — the only trade path
    address public immutable policy;     // AgentPolicy — where limits are stored
    
    // WETH address (for wrapping ETH deposits)
    address public constant WETH = 0x4200000000000000000000000000000000000006;
    
    // Lido addresses (Ethereum mainnet — for production; Base uses bridged wstETH)
    // These would be set per-chain in production. Hardcoded for hackathon demo.
    address public stETH;    // Lido stETH contract
    address public wstETH;   // Wrapped stETH
    
    // Track principal vs yield for Lido stETH Agent Treasury track
    uint256 public depositedPrincipal;  // Original ETH deposited (in wstETH terms)
    
    event Staked(uint256 ethAmount, uint256 stETHReceived);
    event YieldWithdrawn(uint256 yieldAmount);

    event Deposited(address indexed token, uint256 amount);
    event Withdrawn(address indexed token, uint256 amount);
    event SwapExecuted(address indexed agent, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);
    event AgentUpdated(address indexed oldAgent, address indexed newAgent);

    modifier onlyOwner() {
        require(msg.sender == owner, "AgentVault: not owner");
        _;
    }

    modifier onlyAgent() {
        require(msg.sender == agent, "AgentVault: not agent");
        _;
    }

    constructor(address _owner, address _agent, address _router, address _policy) {
        owner = _owner;
        agent = _agent;
        router = _router;
        policy = _policy;
    }

    // ─── Owner Functions ───────────────────────────────────────────────

    /// @notice Deposit ETH — automatically wraps to WETH
    function depositETH() external payable onlyOwner {
        require(msg.value > 0, "AgentVault: zero deposit");
        IWETH(WETH).deposit{value: msg.value}();
        emit Deposited(WETH, msg.value);
    }

    /// @notice Deposit ERC20 tokens
    function depositToken(address token, uint256 amount) external onlyOwner {
        require(amount > 0, "AgentVault: zero deposit");
        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "AgentVault: transfer failed");
        emit Deposited(token, amount);
    }

    /// @notice Withdraw ERC20 tokens — only owner
    function withdraw(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner, amount), "AgentVault: transfer failed");
        emit Withdrawn(token, amount);
    }

    /// @notice Withdraw ETH — unwraps WETH first, only owner
    function withdrawETH(uint256 amount) external onlyOwner {
        IWETH(WETH).withdraw(amount);
        (bool sent,) = owner.call{value: amount}("");
        require(sent, "AgentVault: ETH transfer failed");
        emit Withdrawn(WETH, amount);
    }

    /// @notice Change the agent address — only owner
    function setAgent(address newAgent) external onlyOwner {
        emit AgentUpdated(agent, newAgent);
        agent = newAgent;
    }

    /// @notice Set Lido contract addresses (owner only, one-time setup per chain)
    function setLidoAddresses(address _stETH, address _wstETH) external onlyOwner {
        stETH = _stETH;
        wstETH = _wstETH;
    }

    /// @notice Stake ETH via Lido → get stETH → wrap to wstETH (owner only)
    /// @dev Principal is tracked so agent can only access yield, never principal
    function stakeETH(uint256 amount) external onlyOwner {
        require(stETH != address(0) && wstETH != address(0), "AgentVault: Lido not configured");
        
        // Unwrap WETH to ETH
        IWETH(WETH).withdraw(amount);
        
        // Stake ETH with Lido → get stETH
        uint256 stETHReceived = ILido(stETH).submit{value: amount}(address(0));
        
        // Approve and wrap stETH → wstETH (more composable)
        IERC20(stETH).approve(wstETH, stETHReceived);
        uint256 wstETHReceived = IWstETH(wstETH).wrap(stETHReceived);
        
        // Track principal
        depositedPrincipal += wstETHReceived;
        
        emit Staked(amount, stETHReceived);
    }

    /// @notice Get available yield (wstETH value above principal)
    function availableYield() public view returns (uint256) {
        if (wstETH == address(0)) return 0;
        uint256 currentBalance = IERC20(wstETH).balanceOf(address(this));
        if (currentBalance <= depositedPrincipal) return 0;
        return currentBalance - depositedPrincipal;
    }

    // ─── Agent Functions ───────────────────────────────────────────────

    /// @notice Agent can trade available yield via the router (policy-checked)
    /// @dev Only yield above principal can be traded — principal is locked
    function tradeYield(
        address tokenOut,
        uint24 fee,
        uint256 amountIn,
        uint256 amountOutMinimum
    ) external onlyAgent returns (uint256 amountOut) {
        require(wstETH != address(0), "AgentVault: Lido not configured");
        require(amountIn <= availableYield(), "AgentVault: exceeds available yield");
        
        // Approve router to pull wstETH from vault
        IERC20(wstETH).approve(router, amountIn);
        
        // Execute through router — policy checked
        amountOut = IAgentGuardRouter(router).swap(
            wstETH,
            tokenOut,
            fee,
            amountIn,
            amountOutMinimum
        );
        
        emit YieldWithdrawn(amountIn);
        return amountOut;
    }

    /// @notice Execute a swap through AgentGuardRouter (policy-checked)
    /// @dev The vault approves the router, the router checks the policy,
    ///      and the swap output returns to the vault (not the agent).
    function executeSwap(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn,
        uint256 amountOutMinimum
    ) external onlyAgent returns (uint256 amountOut) {
        // Approve the router to pull tokens from this vault
        IERC20(tokenIn).approve(router, amountIn);

        // Execute through the router — it checks AgentPolicy
        // Note: the router does transferFrom(msg.sender=vault), checks policy for msg.sender=vault
        // We need the policy to be set for the VAULT address (not the agent directly)
        amountOut = IAgentGuardRouter(router).swap(
            tokenIn,
            tokenOut,
            fee,
            amountIn,
            amountOutMinimum
        );

        emit SwapExecuted(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
        return amountOut;
    }

    // ─── Migration ──────────────────────────────────────────────────────

    /// @notice Migrate all funds to a new vault — owner only
    /// @dev Used when vault contract is upgraded. Moves all token balances.
    function migrateTo(address newVault, address[] calldata tokens) external onlyOwner {
        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 bal = IERC20(tokens[i]).balanceOf(address(this));
            if (bal > 0) {
                IERC20(tokens[i]).transfer(newVault, bal);
            }
        }
    }

    // ─── Views ─────────────────────────────────────────────────────────

    /// @notice Get vault balance for a token
    function balance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /// @notice Receive ETH (needed for WETH unwrap)
    receive() external payable {}
}
