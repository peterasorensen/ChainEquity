// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import "../src/GatedEquityToken.sol";

contract GatedEquityTokenTest is Test {
    GatedEquityToken public token;
    address public owner;
    address public user1;
    address public user2;
    address public user3;

    // Events to test
    event AllowlistUpdated(address indexed account, bool status);
    event StockSplit(uint256 oldMultiplier, uint256 newMultiplier);
    event SymbolChanged(string oldSymbol, string newSymbol);

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        user3 = address(0x3);

        token = new GatedEquityToken("TestCompany", "TEST", owner);
    }

    // ============ Initialization Tests ============

    function testInitialState() public {
        assertEq(token.name(), "TestCompany");
        assertEq(token.symbol(), "TEST");
        assertEq(token.totalSupply(), 0);
        assertEq(token.splitMultiplier(), 1e18);
        assertEq(token.owner(), owner);
    }

    // ============ Allowlist Tests ============

    function testAddToAllowlist() public {
        vm.expectEmit(true, false, false, true);
        emit AllowlistUpdated(user1, true);

        token.addToAllowlist(user1);
        assertTrue(token.allowlist(user1));
    }

    function testRemoveFromAllowlist() public {
        token.addToAllowlist(user1);
        assertTrue(token.allowlist(user1));

        vm.expectEmit(true, false, false, true);
        emit AllowlistUpdated(user1, false);

        token.removeFromAllowlist(user1);
        assertFalse(token.allowlist(user1));
    }

    function testCannotAddZeroAddressToAllowlist() public {
        vm.expectRevert("GatedEquityToken: zero address");
        token.addToAllowlist(address(0));
    }

    function testOnlyOwnerCanModifyAllowlist() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        token.addToAllowlist(user2);

        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        token.removeFromAllowlist(user2);
    }

    // ============ Minting Tests ============

    function testMintToApprovedWallet() public {
        token.addToAllowlist(user1);

        token.mint(user1, 1000e18);

        assertEq(token.balanceOf(user1), 1000e18);
        assertEq(token.totalSupply(), 1000e18);
    }

    function testCannotMintToNonApprovedWallet() public {
        vm.expectRevert("GatedEquityToken: recipient not on allowlist");
        token.mint(user1, 1000e18);
    }

    function testOnlyOwnerCanMint() public {
        token.addToAllowlist(user1);

        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        token.mint(user1, 1000e18);
    }

    // ============ Transfer Tests ============

    function testTransferBetweenApprovedWallets() public {
        // Setup: Add both users to allowlist and mint tokens
        token.addToAllowlist(user1);
        token.addToAllowlist(user2);
        token.mint(user1, 1000e18);

        // Execute transfer
        vm.prank(user1);
        token.transfer(user2, 500e18);

        // Verify balances
        assertEq(token.balanceOf(user1), 500e18);
        assertEq(token.balanceOf(user2), 500e18);
    }

    function testCannotTransferToNonApprovedWallet() public {
        // Setup: Only user1 is approved
        token.addToAllowlist(user1);
        token.mint(user1, 1000e18);

        // Try to transfer to non-approved user2
        vm.prank(user1);
        vm.expectRevert("GatedEquityToken: recipient not on allowlist");
        token.transfer(user2, 500e18);
    }

    function testCannotTransferFromNonApprovedWallet() public {
        // Setup: Add user1 to allowlist and mint
        token.addToAllowlist(user1);
        token.mint(user1, 1000e18);

        // Remove user1 from allowlist
        token.removeFromAllowlist(user1);

        // Add user2 to allowlist
        token.addToAllowlist(user2);

        // Try to transfer from non-approved user1
        vm.prank(user1);
        vm.expectRevert("GatedEquityToken: sender not on allowlist");
        token.transfer(user2, 500e18);
    }

    function testRevokeApprovalPreventsTransfer() public {
        // Setup: Both users approved and user1 has tokens
        token.addToAllowlist(user1);
        token.addToAllowlist(user2);
        token.mint(user1, 1000e18);

        // Revoke user1's approval
        token.removeFromAllowlist(user1);

        // Try to transfer - should fail
        vm.prank(user1);
        vm.expectRevert("GatedEquityToken: sender not on allowlist");
        token.transfer(user2, 500e18);
    }

    // ============ TransferFrom Tests ============

    function testTransferFromBetweenApprovedWallets() public {
        // Setup
        token.addToAllowlist(user1);
        token.addToAllowlist(user2);
        token.addToAllowlist(user3);
        token.mint(user1, 1000e18);

        // user1 approves user3 to spend tokens
        vm.prank(user1);
        token.approve(user3, 500e18);

        // user3 transfers from user1 to user2
        vm.prank(user3);
        token.transferFrom(user1, user2, 500e18);

        // Verify balances
        assertEq(token.balanceOf(user1), 500e18);
        assertEq(token.balanceOf(user2), 500e18);
    }

    function testCannotTransferFromToNonApprovedRecipient() public {
        // Setup
        token.addToAllowlist(user1);
        token.addToAllowlist(user3);
        token.mint(user1, 1000e18);

        // user1 approves user3
        vm.prank(user1);
        token.approve(user3, 500e18);

        // user3 tries to transfer to non-approved user2
        vm.prank(user3);
        vm.expectRevert("GatedEquityToken: recipient not on allowlist");
        token.transferFrom(user1, user2, 500e18);
    }

    function testCannotTransferFromNonApprovedSender() public {
        // Setup
        token.addToAllowlist(user1);
        token.addToAllowlist(user2);
        token.addToAllowlist(user3);
        token.mint(user1, 1000e18);

        // user1 approves user3
        vm.prank(user1);
        token.approve(user3, 500e18);

        // Remove user1 from allowlist
        token.removeFromAllowlist(user1);

        // user3 tries to transfer from non-approved user1
        vm.prank(user3);
        vm.expectRevert("GatedEquityToken: sender not on allowlist");
        token.transferFrom(user1, user2, 500e18);
    }

    // ============ Stock Split Tests ============

    function testStockSplit7For1() public {
        // Setup: Mint tokens to user1
        token.addToAllowlist(user1);
        token.mint(user1, 1000e18);

        uint256 balanceBeforeSplit = token.balanceOf(user1);
        uint256 supplyBeforeSplit = token.totalSupply();

        // Execute 7-for-1 stock split
        vm.expectEmit(false, false, false, true);
        emit StockSplit(1e18, 7e18);

        token.stockSplit(7, 1);

        // Verify multiplier updated
        assertEq(token.splitMultiplier(), 7e18);

        // Verify balances multiplied by 7
        assertEq(token.balanceOf(user1), balanceBeforeSplit * 7);
        assertEq(token.totalSupply(), supplyBeforeSplit * 7);
    }

    function testStockSplitWithMultipleHolders() public {
        // Setup: Multiple holders
        token.addToAllowlist(user1);
        token.addToAllowlist(user2);
        token.mint(user1, 1000e18);
        token.mint(user2, 500e18);

        // Execute split
        token.stockSplit(7, 1);

        // Verify all balances multiplied
        assertEq(token.balanceOf(user1), 7000e18);
        assertEq(token.balanceOf(user2), 3500e18);
        assertEq(token.totalSupply(), 10500e18);
    }

    function testReverseSplit1For10() public {
        // Setup
        token.addToAllowlist(user1);
        token.mint(user1, 1000e18);

        // Execute 1-for-10 reverse split
        token.stockSplit(1, 10);

        // Verify multiplier
        assertEq(token.splitMultiplier(), 1e17); // 0.1 * 1e18

        // Verify balance divided by 10
        assertEq(token.balanceOf(user1), 100e18);
    }

    function testCannotSplitWithZeroNumerator() public {
        vm.expectRevert("GatedEquityToken: invalid split ratio");
        token.stockSplit(0, 1);
    }

    function testCannotSplitWithZeroDenominator() public {
        vm.expectRevert("GatedEquityToken: invalid split ratio");
        token.stockSplit(7, 0);
    }

    function testOnlyOwnerCanExecuteStockSplit() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        token.stockSplit(7, 1);
    }

    function testTransferAfterStockSplit() public {
        // Setup
        token.addToAllowlist(user1);
        token.addToAllowlist(user2);
        token.mint(user1, 1000e18);

        // Execute split
        token.stockSplit(7, 1);

        // Transfer after split
        vm.prank(user1);
        token.transfer(user2, 3500e18); // Half of 7000

        // Verify balances
        assertEq(token.balanceOf(user1), 3500e18);
        assertEq(token.balanceOf(user2), 3500e18);
    }

    // ============ Symbol Change Tests ============

    function testChangeSymbol() public {
        vm.expectEmit(false, false, false, true);
        emit SymbolChanged("TEST", "NEWTEST");

        token.changeSymbol("NEWTEST");

        assertEq(token.symbol(), "NEWTEST");
        assertEq(token.name(), "TestCompany"); // Name should not change
    }

    function testSymbolChangeDoesNotAffectBalances() public {
        // Setup
        token.addToAllowlist(user1);
        token.mint(user1, 1000e18);

        uint256 balanceBefore = token.balanceOf(user1);
        uint256 supplyBefore = token.totalSupply();

        // Change symbol
        token.changeSymbol("NEWTEST");

        // Verify balances unchanged
        assertEq(token.balanceOf(user1), balanceBefore);
        assertEq(token.totalSupply(), supplyBefore);
    }

    function testOnlyOwnerCanChangeSymbol() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        token.changeSymbol("HACK");
    }

    // ============ Complex Scenario Tests ============

    function testCompleteWorkflow() public {
        // 1. Approve wallet
        token.addToAllowlist(user1);
        assertTrue(token.allowlist(user1));

        // 2. Mint tokens
        token.mint(user1, 1000e18);
        assertEq(token.balanceOf(user1), 1000e18);

        // 3. Approve another wallet and transfer
        token.addToAllowlist(user2);
        vm.prank(user1);
        token.transfer(user2, 300e18);
        assertEq(token.balanceOf(user1), 700e18);
        assertEq(token.balanceOf(user2), 300e18);

        // 4. Execute 7-for-1 stock split
        token.stockSplit(7, 1);
        assertEq(token.balanceOf(user1), 4900e18);
        assertEq(token.balanceOf(user2), 2100e18);
        assertEq(token.totalSupply(), 7000e18);

        // 5. Transfer after split
        vm.prank(user1);
        token.transfer(user2, 1400e18);
        assertEq(token.balanceOf(user1), 3500e18);
        assertEq(token.balanceOf(user2), 3500e18);

        // 6. Change symbol
        token.changeSymbol("NEWTEST");
        assertEq(token.symbol(), "NEWTEST");

        // 7. Verify balances still correct
        assertEq(token.balanceOf(user1), 3500e18);
        assertEq(token.balanceOf(user2), 3500e18);

        // 8. Revoke approval and verify transfer fails
        token.removeFromAllowlist(user1);
        vm.prank(user1);
        vm.expectRevert("GatedEquityToken: sender not on allowlist");
        token.transfer(user2, 100e18);
    }

    function testMultipleStockSplits() public {
        // Setup
        token.addToAllowlist(user1);
        token.mint(user1, 1000e18);

        // First split: 2-for-1
        token.stockSplit(2, 1);
        assertEq(token.balanceOf(user1), 2000e18);
        assertEq(token.splitMultiplier(), 2e18);

        // Second split: 3-for-1
        token.stockSplit(3, 1);
        assertEq(token.balanceOf(user1), 6000e18);
        assertEq(token.splitMultiplier(), 6e18);

        // Third split: 2-for-1
        token.stockSplit(2, 1);
        assertEq(token.balanceOf(user1), 12000e18);
        assertEq(token.splitMultiplier(), 12e18);
    }

    // ============ Edge Cases ============

    function testZeroBalanceAfterSplit() public {
        token.addToAllowlist(user1);
        token.mint(user1, 0);

        token.stockSplit(7, 1);

        assertEq(token.balanceOf(user1), 0);
    }

    function testVeryLargeAmounts() public {
        token.addToAllowlist(user1);
        uint256 largeAmount = 1_000_000_000e18; // 1 billion tokens

        token.mint(user1, largeAmount);
        assertEq(token.balanceOf(user1), largeAmount);

        token.stockSplit(7, 1);
        assertEq(token.balanceOf(user1), largeAmount * 7);
    }

    function testApproveAndTransferFromWorkWithSplit() public {
        // Setup
        token.addToAllowlist(user1);
        token.addToAllowlist(user2);
        token.addToAllowlist(user3);
        token.mint(user1, 1000e18);

        // Approve before split
        vm.prank(user1);
        token.approve(user3, 1000e18);

        // Execute split
        token.stockSplit(7, 1);

        // Check allowance is still in base units
        assertEq(token.allowance(user1, user3), 1000e18);

        // Transfer using the multiplied amount
        vm.prank(user3);
        token.transferFrom(user1, user2, 3500e18);

        assertEq(token.balanceOf(user1), 3500e18);
        assertEq(token.balanceOf(user2), 3500e18);
    }
}
