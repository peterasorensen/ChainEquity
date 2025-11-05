// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GatedEquityToken
 * @notice A gated ERC20 token representing company equity with stock split capabilities
 * @dev Only addresses on the allowlist can send or receive tokens
 * The contract implements a multiplier-based stock split mechanism for efficiency
 */
contract GatedEquityToken is ERC20, Ownable {
    // Storage variables for mutable name and symbol
    string private _tokenName;
    string private _tokenSymbol;

    // Allowlist for approved addresses
    mapping(address => bool) public allowlist;

    // Stock split multiplier (starts at 1e18 for precision)
    // When a 7-for-1 split occurs, multiplier becomes 7e18
    uint256 public splitMultiplier;

    // Events
    event AllowlistUpdated(address indexed account, bool status);
    event StockSplit(uint256 oldMultiplier, uint256 newMultiplier);
    event SymbolChanged(string oldSymbol, string newSymbol);

    /**
     * @notice Constructor to initialize the token
     * @param name_ Initial token name
     * @param symbol_ Initial token symbol
     * @param initialOwner Address that will be set as the owner
     */
    constructor(
        string memory name_,
        string memory symbol_,
        address initialOwner
    ) ERC20("", "") Ownable(initialOwner) {
        _tokenName = name_;
        _tokenSymbol = symbol_;
        splitMultiplier = 1e18; // Start with 1x multiplier (using 18 decimals for precision)
    }

    /**
     * @notice Returns the name of the token
     * @return Token name
     */
    function name() public view virtual override returns (string memory) {
        return _tokenName;
    }

    /**
     * @notice Returns the symbol of the token
     * @return Token symbol
     */
    function symbol() public view virtual override returns (string memory) {
        return _tokenSymbol;
    }

    /**
     * @notice Add an address to the allowlist
     * @param account Address to add
     */
    function addToAllowlist(address account) external onlyOwner {
        require(account != address(0), "GatedEquityToken: zero address");
        allowlist[account] = true;
        emit AllowlistUpdated(account, true);
    }

    /**
     * @notice Remove an address from the allowlist
     * @param account Address to remove
     */
    function removeFromAllowlist(address account) external onlyOwner {
        allowlist[account] = false;
        emit AllowlistUpdated(account, false);
    }

    /**
     * @notice Mint new tokens to an address
     * @param to Address to mint tokens to
     * @param amount Base amount of tokens to mint (before multiplier)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(allowlist[to], "GatedEquityToken: recipient not on allowlist");
        _mint(to, amount);
    }

    /**
     * @notice Execute a stock split
     * @param numerator The numerator of the split ratio
     * @param denominator The denominator of the split ratio
     * @dev For a 7-for-1 split, call stockSplit(7, 1)
     */
    function stockSplit(uint256 numerator, uint256 denominator) external onlyOwner {
        require(numerator > 0 && denominator > 0, "GatedEquityToken: invalid split ratio");

        uint256 oldMultiplier = splitMultiplier;
        splitMultiplier = (splitMultiplier * numerator) / denominator;

        emit StockSplit(oldMultiplier, splitMultiplier);
    }

    /**
     * @notice Change the token symbol
     * @param newSymbol New symbol for the token
     */
    function changeSymbol(string memory newSymbol) external onlyOwner {
        string memory oldSymbol = _tokenSymbol;
        _tokenSymbol = newSymbol;
        emit SymbolChanged(oldSymbol, newSymbol);
    }

    /**
     * @notice Get the balance of an account with multiplier applied
     * @param account Address to check balance for
     * @return Balance with split multiplier applied
     */
    function balanceOf(address account) public view virtual override returns (uint256) {
        uint256 baseBalance = super.balanceOf(account);
        return (baseBalance * splitMultiplier) / 1e18;
    }

    /**
     * @notice Get the total supply with multiplier applied
     * @return Total supply with split multiplier applied
     */
    function totalSupply() public view virtual override returns (uint256) {
        uint256 baseSupply = super.totalSupply();
        return (baseSupply * splitMultiplier) / 1e18;
    }

    /**
     * @notice Override transfer to enforce allowlist
     * @param to Recipient address
     * @param value Amount to transfer (will be adjusted for multiplier internally)
     */
    function transfer(address to, uint256 value) public virtual override returns (bool) {
        require(allowlist[msg.sender], "GatedEquityToken: sender not on allowlist");
        require(allowlist[to], "GatedEquityToken: recipient not on allowlist");

        // Convert the value back to base amount for internal transfer
        uint256 baseValue = (value * 1e18) / splitMultiplier;
        return super.transfer(to, baseValue);
    }

    /**
     * @notice Override transferFrom to enforce allowlist
     * @param from Sender address
     * @param to Recipient address
     * @param value Amount to transfer (will be adjusted for multiplier internally)
     */
    function transferFrom(address from, address to, uint256 value) public virtual override returns (bool) {
        require(allowlist[from], "GatedEquityToken: sender not on allowlist");
        require(allowlist[to], "GatedEquityToken: recipient not on allowlist");

        // Convert the value back to base amount for internal transfer
        uint256 baseValue = (value * 1e18) / splitMultiplier;
        return super.transferFrom(from, to, baseValue);
    }
}
