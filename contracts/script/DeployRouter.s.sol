// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {AgentGuardRouter} from "../src/AgentGuardRouter.sol";

contract DeployRouter is Script {
    function run() external {
        // Our deployed AgentPolicy on Base Sepolia
        address policy = 0x63649f61F29CE6dC9415263F4b727Bc908206Fbc;
        // Uniswap V3 SwapRouter02 on Base Sepolia
        address swapRouter = 0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4;

        vm.startBroadcast();
        AgentGuardRouter router = new AgentGuardRouter(policy, swapRouter);
        console.log("AgentGuardRouter deployed at:", address(router));
        vm.stopBroadcast();
    }
}
