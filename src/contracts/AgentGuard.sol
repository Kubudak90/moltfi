// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {SwapParams} from "v4-core/src/types/PoolOperation.sol";
import {BalanceDelta} from "v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "v4-core/src/types/BeforeSwapDelta.sol";
import {ModifyLiquidityParams} from "v4-core/src/types/PoolOperation.sol";
import {Currency} from "v4-core/src/types/Currency.sol";

/**
 * @title AgentGuard
 * @notice Uniswap v4 hook that enforces human-defined spending limits on agent swaps.
 *
 * The human sets per-swap limits, daily caps, and approved tokens.
 * The agent operates freely within those boundaries.
 * If the agent exceeds them, the swap reverts onchain.
 */
contract AgentGuard is IHooks {

    IPoolManager public immutable POOL_MANAGER;

    // ─── Policy Storage ────────────────────────────────────────────────

    struct Policy {
        uint256 maxPerSwap;       // Max input amount per swap
        uint256 dailyLimit;       // Max total spending per 24h
        bool active;
    }

    // human => agent => policy
    mapping(address => mapping(address => Policy)) public policies;

    // agent => day => amount spent
    mapping(address => mapping(uint256 => uint256)) public dailySpent;

    // agent => human (who controls this agent's policy)
    mapping(address => address) public agentOwner;

    // agent => token => approved
    mapping(address => mapping(address => bool)) public approvedTokens;

    // ─── Events ────────────────────────────────────────────────────────

    event PolicySet(address indexed human, address indexed agent, uint256 maxPerSwap, uint256 dailyLimit);
    event PolicyRevoked(address indexed human, address indexed agent);
    event SwapGuarded(address indexed agent, address tokenIn, uint256 amount, uint256 dailyTotal);
    event TokenApproved(address indexed agent, address indexed token);
    event TokenRemoved(address indexed agent, address indexed token);

    // ─── Constructor ───────────────────────────────────────────────────

    constructor(IPoolManager _poolManager) {
        POOL_MANAGER = _poolManager;
    }

    // ─── Human Controls ────────────────────────────────────────────────

    function setPolicy(address agent, uint256 maxPerSwap, uint256 dailyLimit) external {
        policies[msg.sender][agent] = Policy({
            maxPerSwap: maxPerSwap,
            dailyLimit: dailyLimit,
            active: true
        });
        agentOwner[agent] = msg.sender;
        emit PolicySet(msg.sender, agent, maxPerSwap, dailyLimit);
    }

    function revokePolicy(address agent) external {
        require(agentOwner[agent] == msg.sender, "Not agent owner");
        policies[msg.sender][agent].active = false;
        emit PolicyRevoked(msg.sender, agent);
    }

    function approveToken(address agent, address token) external {
        require(agentOwner[agent] == msg.sender, "Not agent owner");
        approvedTokens[agent][token] = true;
        emit TokenApproved(agent, token);
    }

    function removeToken(address agent, address token) external {
        require(agentOwner[agent] == msg.sender, "Not agent owner");
        approvedTokens[agent][token] = false;
        emit TokenRemoved(agent, token);
    }

    // ─── Hook: beforeSwap (enforcement) ────────────────────────────────

    function beforeSwap(
        address sender,
        PoolKey calldata key,
        SwapParams calldata params,
        bytes calldata
    ) external override returns (bytes4, BeforeSwapDelta, uint24) {
        require(msg.sender == address(POOL_MANAGER), "Only PoolManager");

        address agent = sender;
        address human = agentOwner[agent];

        // Opt-in: no policy = no restrictions
        if (human == address(0)) {
            return (IHooks.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
        }

        Policy memory policy = policies[human][agent];
        require(policy.active, "AgentGuard: policy revoked");

        // Check token approval
        address tokenIn = params.zeroForOne
            ? Currency.unwrap(key.currency0)
            : Currency.unwrap(key.currency1);
        require(approvedTokens[agent][tokenIn], "AgentGuard: token not approved");

        // Check per-swap limit
        uint256 amount = params.amountSpecified > 0
            ? uint256(params.amountSpecified)
            : uint256(-params.amountSpecified);
        require(amount <= policy.maxPerSwap, "AgentGuard: exceeds per-swap limit");

        // Check daily limit
        uint256 today = block.timestamp / 1 days;
        uint256 newDaily = dailySpent[agent][today] + amount;
        require(newDaily <= policy.dailyLimit, "AgentGuard: exceeds daily limit");
        dailySpent[agent][today] = newDaily;

        emit SwapGuarded(agent, tokenIn, amount, newDaily);

        return (IHooks.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

    // ─── Hook: afterSwap (audit log) ───────────────────────────────────

    function afterSwap(
        address,
        PoolKey calldata,
        SwapParams calldata,
        BalanceDelta,
        bytes calldata
    ) external pure override returns (bytes4, int128) {
        return (IHooks.afterSwap.selector, 0);
    }

    // ─── Unused hooks (required by IHooks) ─────────────────────────────

    function beforeInitialize(address, PoolKey calldata, uint160) external pure override returns (bytes4) {
        return IHooks.beforeInitialize.selector;
    }

    function afterInitialize(address, PoolKey calldata, uint160, int24) external pure override returns (bytes4) {
        return IHooks.afterInitialize.selector;
    }

    function beforeAddLiquidity(address, PoolKey calldata, ModifyLiquidityParams calldata, bytes calldata)
        external pure override returns (bytes4) {
        return IHooks.beforeAddLiquidity.selector;
    }

    function afterAddLiquidity(address, PoolKey calldata, ModifyLiquidityParams calldata, BalanceDelta, BalanceDelta, bytes calldata)
        external pure override returns (bytes4, BalanceDelta) {
        return (IHooks.afterAddLiquidity.selector, BalanceDelta.wrap(0));
    }

    function beforeRemoveLiquidity(address, PoolKey calldata, ModifyLiquidityParams calldata, bytes calldata)
        external pure override returns (bytes4) {
        return IHooks.beforeRemoveLiquidity.selector;
    }

    function afterRemoveLiquidity(address, PoolKey calldata, ModifyLiquidityParams calldata, BalanceDelta, BalanceDelta, bytes calldata)
        external pure override returns (bytes4, BalanceDelta) {
        return (IHooks.afterRemoveLiquidity.selector, BalanceDelta.wrap(0));
    }

    function beforeDonate(address, PoolKey calldata, uint256, uint256, bytes calldata) external pure override returns (bytes4) {
        return IHooks.beforeDonate.selector;
    }

    function afterDonate(address, PoolKey calldata, uint256, uint256, bytes calldata) external pure override returns (bytes4) {
        return IHooks.afterDonate.selector;
    }

    // ─── View Functions ────────────────────────────────────────────────

    function getDailySpent(address agent) external view returns (uint256) {
        return dailySpent[agent][block.timestamp / 1 days];
    }

    function getRemainingAllowance(address agent) external view returns (uint256) {
        address human = agentOwner[agent];
        if (human == address(0)) return type(uint256).max;

        Policy memory policy = policies[human][agent];
        if (!policy.active) return 0;

        uint256 spent = dailySpent[agent][block.timestamp / 1 days];
        if (spent >= policy.dailyLimit) return 0;
        return policy.dailyLimit - spent;
    }
}
