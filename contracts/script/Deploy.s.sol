// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Script.sol";
import "../src/GatedEquityToken.sol";

/**
 * @title Deploy
 * @notice Deployment script for GatedEquityToken
 * @dev Run with: forge script script/Deploy.s.sol:Deploy --rpc-url <rpc-url> --broadcast
 */
contract Deploy is Script {
    function run() public {
        // Get private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Get deployer address
        address deployer = vm.addr(deployerPrivateKey);

        // Deploy the GatedEquityToken contract
        GatedEquityToken token = new GatedEquityToken(
            "ChainEquity", // Token name
            "CEQT",        // Token symbol
            deployer       // Initial owner
        );

        // Stop broadcasting
        vm.stopBroadcast();

        // Log deployment information
        console.log("===================================");
        console.log("GatedEquityToken Deployed!");
        console.log("===================================");
        console.log("Contract Address:", address(token));
        console.log("Owner:", deployer);
        console.log("Token Name:", token.name());
        console.log("Token Symbol:", token.symbol());
        console.log("Split Multiplier:", token.splitMultiplier());
        console.log("===================================");
    }
}
