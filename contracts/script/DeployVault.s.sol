// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/VaultFactory.sol";

contract DeployVaultFactory is Script {
    function run() external {
        // Policy = AgentPolicy (where limits are stored)
        address policyContract = 0x63649f61F29CE6dC9415263F4b727Bc908206Fbc;
        
        // Router = AgentGuardRouter (policy-checked swap path)
        address router = 0x5Cc04847CE5A81319b55D34F9fB757465D3677E6;

        vm.startBroadcast();
        
        VaultFactory factory = new VaultFactory(policyContract, router);
        
        console.log("VaultFactory deployed at:", address(factory));
        console.log("Policy:", policyContract);
        console.log("Router:", router);
        
        vm.stopBroadcast();
    }
}
