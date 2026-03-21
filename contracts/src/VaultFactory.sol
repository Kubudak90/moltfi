// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AgentVault} from "./AgentVault.sol";
import {AgentPolicy} from "./AgentPolicy.sol";

/**
 * @title VaultFactory
 * @notice Deploys AgentVault instances for users. One call = vault + policy setup.
 *         User connects wallet, sets guardrails, we handle the rest.
 *
 * Flow:
 * 1. User calls createVault(agent, maxPerAction, dailyLimit, approvedTokens)
 * 2. Factory deploys a new AgentVault with user as owner
 * 3. Factory sets the policy on AgentPolicy for the new vault
 * 4. Factory approves the specified tokens
 * 5. Returns the vault address — user can now deposit funds
 */
contract VaultFactory {
    AgentPolicy public immutable POLICY;
    address public immutable ROUTER;

    // owner => list of vaults they've created
    mapping(address => address[]) public userVaults;
    
    // vault => owner (for lookups)
    mapping(address => address) public vaultOwner;

    // all vaults ever created
    address[] public allVaults;

    event VaultCreated(
        address indexed owner,
        address indexed agent,
        address vault,
        uint256 maxPerAction,
        uint256 dailyLimit
    );

    constructor(address _policy, address _router) {
        POLICY = AgentPolicy(_policy);
        ROUTER = _router;
    }

    /**
     * @notice Create a vault with guardrails in one transaction.
     * @param agent The AI agent's wallet address
     * @param maxPerAction Maximum amount per single trade
     * @param dailyLimit Maximum total volume per day
     * @param tokens List of token addresses the agent is allowed to trade
     * @return vault The deployed vault address
     */
    function createVault(
        address agent,
        uint256 maxPerAction,
        uint256 dailyLimit,
        address[] calldata tokens
    ) external returns (address vault) {
        // 1. Deploy vault — user (msg.sender) is the owner
        AgentVault v = new AgentVault(msg.sender, agent, ROUTER, address(POLICY));
        vault = address(v);

        // 2. Set policy on AgentPolicy — factory becomes agentOwner[vault]
        //    This means policy updates go through the factory (updatePolicy below)
        POLICY.setPolicy(vault, maxPerAction, dailyLimit);

        // 3. Approve tokens for the vault
        for (uint256 i = 0; i < tokens.length; i++) {
            POLICY.approveToken(vault, tokens[i]);
        }

        // 5. Track
        userVaults[msg.sender].push(vault);
        vaultOwner[vault] = msg.sender;
        allVaults.push(vault);

        emit VaultCreated(msg.sender, agent, vault, maxPerAction, dailyLimit);
        return vault;
    }

    /// @notice Update guardrails for an existing vault — only the vault's owner can call
    function updatePolicy(
        address vault,
        uint256 maxPerAction,
        uint256 dailyLimit
    ) external {
        require(vaultOwner[vault] == msg.sender, "VaultFactory: not vault owner");
        POLICY.setPolicy(vault, maxPerAction, dailyLimit);
    }

    /// @notice Approve a new token for trading — only the vault's owner can call
    function approveToken(address vault, address token) external {
        require(vaultOwner[vault] == msg.sender, "VaultFactory: not vault owner");
        POLICY.approveToken(vault, token);
    }

    /// @notice Remove a token from trading — only the vault's owner can call
    function removeToken(address vault, address token) external {
        require(vaultOwner[vault] == msg.sender, "VaultFactory: not vault owner");
        POLICY.removeToken(vault, token);
    }

    /// @notice Revoke the agent's policy entirely — emergency stop
    function revokePolicy(address vault) external {
        require(vaultOwner[vault] == msg.sender, "VaultFactory: not vault owner");
        POLICY.revokePolicy(vault);
    }

    /// @notice Get all vaults for a user
    function getVaults(address user) external view returns (address[] memory) {
        return userVaults[user];
    }

    /// @notice Total vaults created
    function totalVaults() external view returns (uint256) {
        return allVaults.length;
    }
}
