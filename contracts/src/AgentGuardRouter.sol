// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AgentPolicy} from "./AgentPolicy.sol";

/**
 * @title AgentGuardRouter
 * @notice Wraps Uniswap V3 SwapRouter02 — enforces policy BEFORE forwarding the swap.
 *
 * Flow:
 * 1. Agent calls AgentGuardRouter.swap() instead of calling Uniswap directly
 * 2. Router checks the agent's policy via AgentPolicy.enforceAndRecord()
 * 3. If allowed → transfers tokens from agent, approves SwapRouter, executes swap
 * 4. If policy violated → reverts. Funds never move.
 */

// SwapRouter02 interface (no deadline in struct)
interface ISwapRouter02 {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
}

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
}

contract AgentGuardRouter {

    AgentPolicy public immutable POLICY;
    ISwapRouter02 public immutable SWAP_ROUTER;

    event SwapExecuted(
        address indexed agent,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    constructor(address _policy, address _swapRouter) {
        POLICY = AgentPolicy(_policy);
        SWAP_ROUTER = ISwapRouter02(_swapRouter);
    }

    /**
     * @notice Execute a swap through Uniswap, but only if it passes the agent's policy.
     * @dev Agent must have approved this contract for tokenIn.
     */
    function swap(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn,
        uint256 amountOutMinimum
    ) external returns (uint256 amountOut) {
        // 1. Check policy — reverts if not allowed
        POLICY.enforceAndRecord(msg.sender, tokenIn, amountIn);

        // 2. Pull tokens from agent to this contract
        require(
            IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn),
            "AgentGuardRouter: transferFrom failed"
        );

        // 3. Approve SwapRouter to spend tokens
        IERC20(tokenIn).approve(address(SWAP_ROUTER), amountIn);

        // 4. Execute the swap on Uniswap — tokens go directly to the agent
        amountOut = SWAP_ROUTER.exactInputSingle(
            ISwapRouter02.ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: fee,
                recipient: msg.sender,
                amountIn: amountIn,
                amountOutMinimum: amountOutMinimum,
                sqrtPriceLimitX96: 0
            })
        );

        emit SwapExecuted(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
        return amountOut;
    }

    /**
     * @notice Check if a swap would be allowed without executing it.
     */
    function checkSwap(
        address agent,
        address tokenIn,
        uint256 amountIn
    ) external view returns (bool allowed, string memory reason) {
        return POLICY.checkAction(agent, tokenIn, amountIn);
    }
}
