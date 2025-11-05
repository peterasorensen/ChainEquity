'use client';

import { useState, useEffect } from 'react';
import {
  executeStockSplit,
  changeSymbol,
  getTokenInfo,
  type TokenInfo
} from '../lib/api';
import styles from './CorporateActions.module.css';

export default function CorporateActions() {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [splitMultiplier, setSplitMultiplier] = useState('');
  const [newName, setNewName] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
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

  const handleStockSplit = async () => {
    if (!splitMultiplier || parseFloat(splitMultiplier) <= 1) {
      setError('Please enter a split multiplier greater than 1');
      return;
    }

    if (!confirm(`Are you sure you want to execute a ${splitMultiplier}-for-1 stock split? This action cannot be undone.`)) {
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      setSuccess(null);
      setTxHash(null);

      const result = await executeStockSplit({
        multiplier: parseFloat(splitMultiplier),
      });

      if (result.success) {
        setSuccess(`Successfully executed ${splitMultiplier}-for-1 stock split`);
        setTxHash(result.transactionHash || null);
        setSplitMultiplier('');
        await loadTokenInfo();
      } else {
        setError(result.error || 'Failed to execute stock split');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute stock split');
    } finally {
      setProcessing(false);
    }
  };

  const handleChangeSymbol = async () => {
    if (!newName || !newSymbol) {
      setError('Please enter both new name and symbol');
      return;
    }

    if (!confirm(`Are you sure you want to change the token to "${newName}" (${newSymbol})?`)) {
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      setSuccess(null);
      setTxHash(null);

      const result = await changeSymbol({
        newName,
        newSymbol,
      });

      if (result.success) {
        setSuccess(`Successfully changed token to ${newName} (${newSymbol})`);
        setTxHash(result.transactionHash || null);
        setNewName('');
        setNewSymbol('');
        await loadTokenInfo();
      } else {
        setError(result.error || 'Failed to change symbol');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change symbol');
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

      {txHash && (
        <div className={styles.transactionCard}>
          <div className={styles.transactionTitle}>Transaction Hash</div>
          <div className={styles.transactionHash}>{txHash}</div>
        </div>
      )}

      <div className={styles.grid}>
        {/* Stock Split */}
        <div className={styles.actionCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>
              <div className={styles.cardIcon}>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 10H16M10 4V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              Stock Split
            </h3>
            <p className={styles.cardDescription}>
              Execute a forward stock split to increase the number of shares
            </p>
          </div>

          {tokenInfo && (
            <div className={styles.currentInfo}>
              <div className={styles.currentLabel}>Current Multiplier</div>
              <div className={styles.currentValue}>{tokenInfo.currentMultiplier}x</div>
            </div>
          )}

          <div className={styles.infoBox}>
            <strong>How it works:</strong> A stock split multiplies all token balances by the specified factor.
            For example, a 7-for-1 split means each shareholder will receive 7 tokens for every 1 token they currently hold.
          </div>

          <form className={styles.form} onSubmit={(e) => { e.preventDefault(); handleStockSplit(); }}>
            <div className="form-group">
              <label className="form-label">Split Multiplier</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g., 2 for 2-for-1 split, 7 for 7-for-1 split"
                value={splitMultiplier}
                onChange={(e) => setSplitMultiplier(e.target.value)}
                disabled={processing}
                min="2"
                step="1"
              />
              <div className={styles.exampleBox}>
                <strong>Example:</strong> If you enter <strong>7</strong>, each token holder will receive 7 tokens for every 1 token they own.
                A holder with 100 tokens will have 700 tokens after the split.
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={processing || !splitMultiplier}
              >
                {processing ? 'Processing...' : 'Execute Stock Split'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Symbol */}
        <div className={styles.actionCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>
              <div className={styles.cardIcon}>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 7H16M4 13H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M7 4L4 7L7 10M13 10L16 7L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              Change Name & Symbol
            </h3>
            <p className={styles.cardDescription}>
              Update the token name and ticker symbol
            </p>
          </div>

          {tokenInfo && (
            <div className={styles.currentInfo}>
              <div className={styles.currentLabel}>Current Token</div>
              <div className={styles.currentValue}>
                {tokenInfo.name} ({tokenInfo.symbol})
              </div>
            </div>
          )}

          <div className={styles.warningBox}>
            <strong>Warning:</strong> Changing the token name and symbol will affect how the token is displayed
            in wallets and on blockchain explorers. Make sure this change is intentional and communicated to all stakeholders.
          </div>

          <form className={styles.form} onSubmit={(e) => { e.preventDefault(); handleChangeSymbol(); }}>
            <div className={styles.formRow}>
              <div className="form-group">
                <label className="form-label">New Token Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Acme Corporation"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  disabled={processing}
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Symbol</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., ACME"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                  disabled={processing}
                  maxLength={10}
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={processing || !newName || !newSymbol}
              >
                {processing ? 'Processing...' : 'Change Symbol'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setNewName('');
                  setNewSymbol('');
                }}
                disabled={processing}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
