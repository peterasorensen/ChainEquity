'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { parseEther } from 'viem';
import { polygonAmoy } from '../providers';
import {
  checkAllowlist,
  getAllowlist,
  getTokenInfo,
  getBalance,
  formatNumber,
  formatAddress,
  type TokenInfo,
  type AllowlistEntry
} from '../lib/api';
import { CHAIN_EQUITY_ABI } from '../lib/contract-abi';
import styles from './TransferTokens.module.css';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

export default function TransferTokens() {
  const { address: connectedAddress, chain, connector } = useAccount();
  const chainId = useChainId();
  const { data: hash, writeContract, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [userBalance, setUserBalance] = useState<string>('0');
  const [allowlist, setAllowlist] = useState<AllowlistEntry[]>([]);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isAllowlisted, setIsAllowlisted] = useState(false);
  const [checkingAllowlist, setCheckingAllowlist] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actualChainId, setActualChainId] = useState<number | null>(null);

  // Use wagmi's chainId directly - it's more reliable than WalletConnect provider
  useEffect(() => {
    if (chainId) {
      setActualChainId(chainId);
      console.log('Current chain ID:', chainId);
    }
  }, [chainId]);

  useEffect(() => {
    loadData();
  }, [connectedAddress]);

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      setSuccess(`Successfully transferred ${formatNumber(amount)} tokens to ${formatAddress(recipient)}`);
      setRecipient('');
      setAmount('');
      setIsAllowlisted(false);
      setShowPreview(false);
      loadData(); // Refresh balances
    }
  }, [isConfirmed, hash]);

  // Handle write errors
  useEffect(() => {
    if (writeError) {
      setError(writeError.message || 'Transaction failed');
      setShowPreview(false);
    }
  }, [writeError]);

  const loadData = async () => {
    try {
      const [info, allowlistData] = await Promise.all([
        getTokenInfo(),
        getAllowlist()
      ]);

      setTokenInfo(info);
      setAllowlist(allowlistData.filter(entry => entry.isApproved));

      if (connectedAddress) {
        const balanceResult = await getBalance(connectedAddress);
        setUserBalance(balanceResult.balance);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const handleRecipientChange = async (address: string) => {
    setRecipient(address);
    setIsAllowlisted(false);
    setError(null);
    setShowPreview(false);

    if (address && address.startsWith('0x') && address.length === 42) {
      try {
        setCheckingAllowlist(true);
        const result = await checkAllowlist(address);
        setIsAllowlisted(result.isApproved);

        if (!result.isApproved) {
          setError('This address is not approved. Please add it to the allowlist first.');
        }
      } catch (err) {
        console.error('Failed to check allowlist:', err);
      } finally {
        setCheckingAllowlist(false);
      }
    }
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setShowPreview(false);
  };

  const handleMaxClick = () => {
    setAmount(userBalance);
    setShowPreview(false);
  };

  const handlePreview = () => {
    if (!connectedAddress) {
      setError('Please connect your wallet first');
      return;
    }

    if (!recipient || !amount) {
      setError('Please enter both recipient address and amount');
      return;
    }

    if (!isAllowlisted) {
      setError('Recipient address must be approved first');
      return;
    }

    const amountNum = parseFloat(amount);
    const balanceNum = parseFloat(userBalance);

    if (amountNum <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (amountNum > balanceNum) {
      setError(`Insufficient balance. You have ${formatNumber(userBalance)} tokens`);
      return;
    }

    setError(null);
    setShowPreview(true);
  };

  const handleTransfer = async () => {
    if (!connectedAddress) {
      setError('Please connect your wallet first');
      return;
    }

    if (!CONTRACT_ADDRESS) {
      setError('Contract address not configured');
      return;
    }

    // Check if on correct chain using actual chain ID from wallet
    const expectedChainId = 80002; // Polygon Amoy
    const currentChainId = actualChainId || chainId;

    if (currentChainId !== expectedChainId) {
      const currentChainName = chain?.name || 'Unknown';
      setError(
        `Wrong network detected. Please switch to Polygon Amoy in your wallet.\n` +
        `Expected Chain ID: ${expectedChainId}\n` +
        `Current Chain: ${currentChainName} (ID: ${currentChainId || 'Unknown'})`
      );
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      // Call the contract's transfer function directly with user's wallet
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CHAIN_EQUITY_ABI,
        functionName: 'transfer',
        args: [recipient as `0x${string}`, parseEther(amount)],
        chainId: currentChainId, // Use the current chain ID to prevent auto-switching
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate transfer');
      setShowPreview(false);
    }
  };

  const remainingBalance = showPreview
    ? (parseFloat(userBalance) - parseFloat(amount)).toString()
    : userBalance;

  return (
    <div className={styles.container}>
      {error && (
        <div className={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {success && (
        <div className={styles.success}>
          <strong>Success!</strong> {success}
        </div>
      )}

      {/* Token Information */}
      {tokenInfo && (
        <div className={styles.infoBox}>
          <div className={styles.infoTitle}>Token Information</div>
          <div className={styles.infoItems}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Token Name</span>
              <span className={styles.infoValue}>{tokenInfo.name}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Symbol</span>
              <span className={styles.infoValue}>{tokenInfo.symbol}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Your Balance</span>
              <span className={styles.infoValue}>{formatNumber(userBalance)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Total Supply</span>
              <span className={styles.infoValue}>{formatNumber(tokenInfo.totalSupply)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Form */}
      <div className={styles.transferCard}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Transfer Tokens</h3>
          <p className={styles.cardDescription}>
            Send equity tokens to approved wallet addresses
          </p>
        </div>

        <div className={styles.warning}>
          <strong>Important:</strong> The recipient address must be approved on the allowlist before transferring tokens.
        </div>

        <form className={styles.form} onSubmit={(e) => { e.preventDefault(); showPreview ? handleTransfer() : handlePreview(); }}>
          <div className="form-group">
            <label className="form-label">From Address (Your Wallet)</label>
            <input
              type="text"
              className="form-input"
              value={connectedAddress || 'Not connected'}
              disabled
              readOnly
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              To Address
              {checkingAllowlist && <span className="text-sm"> (Checking...)</span>}
              {isAllowlisted && (
                <span className="badge badge-success" style={{ marginLeft: '0.5rem' }}>
                  Approved
                </span>
              )}
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="0x... or select from allowlist"
              value={recipient}
              onChange={(e) => handleRecipientChange(e.target.value)}
              disabled={isPending || isConfirming}
              list="allowlist-addresses"
            />
            <datalist id="allowlist-addresses">
              {allowlist.map((entry) => (
                <option key={entry.address} value={entry.address}>
                  {formatAddress(entry.address)}
                </option>
              ))}
            </datalist>
            {allowlist.length > 0 && (
              <div className={styles.allowlistDropdown}>
                <div className={styles.allowlistLabel}>Approved addresses:</div>
                <div className={styles.allowlistItems}>
                  {allowlist.map((entry) => (
                    <button
                      key={entry.address}
                      type="button"
                      className={styles.allowlistItem}
                      onClick={() => handleRecipientChange(entry.address)}
                      disabled={isPending || isConfirming}
                    >
                      {formatAddress(entry.address)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              Amount
              <span className={styles.balanceInfo}>
                Balance: {formatNumber(userBalance)}
              </span>
            </label>
            <div className={styles.amountInputWrapper}>
              <input
                type="number"
                className="form-input"
                placeholder="1000"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                disabled={isPending || isConfirming}
                min="0"
                step="1"
              />
              <button
                type="button"
                className={styles.maxButton}
                onClick={handleMaxClick}
                disabled={isPending || isConfirming || !userBalance || parseFloat(userBalance) === 0}
              >
                Max
              </button>
            </div>
          </div>

          {/* Transfer Preview */}
          {showPreview && !isPending && !isConfirming && (
            <div className={styles.previewCard}>
              <div className={styles.previewTitle}>Transfer Preview</div>
              <div className={styles.previewItems}>
                <div className={styles.previewItem}>
                  <span className={styles.previewLabel}>From</span>
                  <span className={styles.previewValue}>{formatAddress(connectedAddress || '')}</span>
                </div>
                <div className={styles.previewItem}>
                  <span className={styles.previewLabel}>To</span>
                  <span className={styles.previewValue}>{formatAddress(recipient)}</span>
                </div>
                <div className={styles.previewItem}>
                  <span className={styles.previewLabel}>Amount</span>
                  <span className={styles.previewValue}>{formatNumber(amount)} {tokenInfo?.symbol}</span>
                </div>
                <div className={styles.previewItem}>
                  <span className={styles.previewLabel}>Remaining Balance</span>
                  <span className={styles.previewValue}>{formatNumber(remainingBalance)} {tokenInfo?.symbol}</span>
                </div>
              </div>
            </div>
          )}

          <div className={styles.formActions}>
            {!showPreview ? (
              <>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isPending || isConfirming || !isAllowlisted || !recipient || !amount || !connectedAddress}
                >
                  Preview Transfer
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setRecipient('');
                    setAmount('');
                    setIsAllowlisted(false);
                    setError(null);
                    setSuccess(null);
                    setShowPreview(false);
                  }}
                  disabled={isPending || isConfirming}
                >
                  Clear
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleTransfer}
                  disabled={isPending || isConfirming}
                >
                  {isPending ? 'Waiting for approval...' : isConfirming ? 'Confirming...' : 'Confirm Transfer'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPreview(false)}
                  disabled={isPending || isConfirming}
                >
                  Edit
                </button>
              </>
            )}
          </div>
        </form>
      </div>

      {/* Transaction Details */}
      {hash && isConfirmed && (
        <div className={styles.transactionCard}>
          <div className={styles.transactionHeader}>
            <div className={`${styles.transactionIcon} ${styles.success}`}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 6L7.5 14.5L4 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className={styles.transactionInfo}>
              <div className={styles.transactionTitle}>Transaction Successful</div>
              <div className={styles.transactionMessage}>Your transfer transaction has been confirmed</div>
            </div>
          </div>
          <div className={styles.transactionHash}>
            <strong>Transaction Hash:</strong><br />
            {hash}
            <a
              href={`https://amoy.polygonscan.com/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ marginLeft: '8px', color: '#3b82f6' }}
            >
              View on Explorer →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
