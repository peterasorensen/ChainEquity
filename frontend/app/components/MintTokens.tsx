'use client';

import { useState, useEffect } from 'react';
import {
  mintTokens,
  checkAllowlist,
  getTokenInfo,
  formatNumber,
  type TokenInfo
} from '../lib/api';
import styles from './MintTokens.module.css';

export default function MintTokens() {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isAllowlisted, setIsAllowlisted] = useState(false);
  const [checkingAllowlist, setCheckingAllowlist] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    loadTokenInfo();
  }, []);

  const loadTokenInfo = async () => {
    try {
      const info = await getTokenInfo();
      setTokenInfo(info);
    } catch (err) {
      console.error('Failed to load token info:', err);
    }
  };

  const handleRecipientChange = async (address: string) => {
    setRecipient(address);
    setIsAllowlisted(false);
    setError(null);

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

  const handleMint = async () => {
    if (!recipient || !amount) {
      setError('Please enter both recipient address and amount');
      return;
    }

    if (!isAllowlisted) {
      setError('Recipient address must be approved first');
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      setSuccess(null);
      setTxHash(null);

      const result = await mintTokens({
        recipient,
        amount,
      });

      if (result.success) {
        setSuccess(`Successfully minted ${formatNumber(amount)} tokens to ${recipient}`);
        setTxHash(result.transactionHash || null);
        setRecipient('');
        setAmount('');
        setIsAllowlisted(false);
        await loadTokenInfo();
      } else {
        setError(result.error || 'Failed to mint tokens');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mint tokens');
    } finally {
      setProcessing(false);
    }
  };

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
              <span className={styles.infoLabel}>Total Supply</span>
              <span className={styles.infoValue}>{formatNumber(tokenInfo.totalSupply)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Current Multiplier</span>
              <span className={styles.infoValue}>{tokenInfo.currentMultiplier}x</span>
            </div>
          </div>
        </div>
      )}

      {/* Mint Form */}
      <div className={styles.mintCard}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Mint New Tokens</h3>
          <p className={styles.cardDescription}>
            Issue new equity tokens to approved wallet addresses
          </p>
        </div>

        <div className={styles.warning}>
          <strong>Important:</strong> The recipient address must be approved on the allowlist before minting tokens.
        </div>

        <form className={styles.form} onSubmit={(e) => { e.preventDefault(); handleMint(); }}>
          <div className="form-group">
            <label className="form-label">
              Recipient Address
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
              placeholder="0x..."
              value={recipient}
              onChange={(e) => handleRecipientChange(e.target.value)}
              disabled={processing}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Amount</label>
            <input
              type="number"
              className="form-input"
              placeholder="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={processing}
              min="1"
              step="1"
            />
          </div>

          <div className={styles.formActions}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={processing || !isAllowlisted || !recipient || !amount}
            >
              {processing ? 'Minting...' : 'Mint Tokens'}
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
                setTxHash(null);
              }}
              disabled={processing}
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Transaction Details */}
      {txHash && (
        <div className={styles.transactionCard}>
          <div className={styles.transactionHeader}>
            <div className={`${styles.transactionIcon} ${styles.success}`}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 6L7.5 14.5L4 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className={styles.transactionInfo}>
              <div className={styles.transactionTitle}>Transaction Successful</div>
              <div className={styles.transactionMessage}>Your mint transaction has been confirmed</div>
            </div>
          </div>
          <div className={styles.transactionHash}>
            <strong>Transaction Hash:</strong><br />
            {txHash}
          </div>
        </div>
      )}
    </div>
  );
}
