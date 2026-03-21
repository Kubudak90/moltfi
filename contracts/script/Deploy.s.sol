// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/AgentPolicy.sol";

contract DeployAgentPolicy is Script {
    function run() external {
        vm.startBroadcast();
        AgentPolicy policy = new AgentPolicy();
        console.log("AgentPolicy deployed at:", address(policy));
        vm.stopBroadcast();
    }
}
