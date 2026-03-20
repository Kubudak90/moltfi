// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AgentPolicy
 * @notice Standalone spending policy contract for AI agents.
 *         Human defines rules, agent checks them before acting, contract enforces onchain.
 *
 *         This is the core policy engine — works independently or can be queried
 *         by a v4 hook (AgentGuard) for protocol-level enforcement.
 */
contract AgentPolicy {

    struct Policy {
        uint256 maxPerAction;     // Max amount per individual action
        uint256 dailyLimit;       // Max total per 24h
        bool active;
    }

    // human => agent => policy
    mapping(address => mapping(address => Policy)) public policies;

    // agent => day => amount spent
    mapping(address => mapping(uint256 => uint256)) public dailySpent;

    // agent => human
    mapping(address => address) public agentOwner;

    // agent => token => approved
    mapping(address => mapping(address => bool)) public approvedTokens;

    // ─── Events ────────────────────────────────────────────────────────

    event PolicySet(address indexed human, address indexed agent, uint256 maxPerAction, uint256 dailyLimit);
    event PolicyRevoked(address indexed human, address indexed agent);
    event ActionRecorded(address indexed agent, address token, uint256 amount, uint256 dailyTotal);
    event TokenApproved(address indexed agent, address indexed token);
    event TokenRemoved(address indexed agent, address indexed token);

    // ─── Human Controls ────────────────────────────────────────────────

    function setPolicy(address agent, uint256 maxPerAction, uint256 dailyLimit) external {
        policies[msg.sender][agent] = Policy({
            maxPerAction: maxPerAction,
            dailyLimit: dailyLimit,
            active: true
        });
        agentOwner[agent] = msg.sender;
        emit PolicySet(msg.sender, agent, maxPerAction, dailyLimit);
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

    // ─── Enforcement ───────────────────────────────────────────────────

    /**
     * @notice Check if an action is allowed AND record it. Reverts if not.
     *         Called by the agent (or a hook) before executing an action.
     */
    function enforceAndRecord(address agent, address token, uint256 amount) external {
        address human = agentOwner[agent];

        // No policy = no restrictions (opt-in)
        if (human == address(0)) return;

        Policy memory policy = policies[human][agent];
        require(policy.active, "AgentPolicy: policy revoked");
        require(approvedTokens[agent][token], "AgentPolicy: token not approved");
        require(amount <= policy.maxPerAction, "AgentPolicy: exceeds per-action limit");

        uint256 today = block.timestamp / 1 days;
        uint256 newDaily = dailySpent[agent][today] + amount;
        require(newDaily <= policy.dailyLimit, "AgentPolicy: exceeds daily limit");
        dailySpent[agent][today] = newDaily;

        emit ActionRecorded(agent, token, amount, newDaily);
    }

    /**
     * @notice Check if an action would be allowed (view only, doesn't record).
     */
    function checkAction(address agent, address token, uint256 amount) external view returns (bool allowed, string memory reason) {
        address human = agentOwner[agent];
        if (human == address(0)) return (true, "");

        Policy memory policy = policies[human][agent];
        if (!policy.active) return (false, "Policy revoked");
        if (!approvedTokens[agent][token]) return (false, "Token not approved");
        if (amount > policy.maxPerAction) return (false, "Exceeds per-action limit");

        uint256 today = block.timestamp / 1 days;
        if (dailySpent[agent][today] + amount > policy.dailyLimit) return (false, "Exceeds daily limit");

        return (true, "");
    }

    // ─── Views ─────────────────────────────────────────────────────────

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
