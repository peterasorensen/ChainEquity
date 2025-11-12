'use client';

import { useState, useEffect } from 'react';
import { getRecentTransactions, getTransactionsByAddress, formatNumber, formatAddress, type TransactionsData, type TransactionEntry } from '../lib/api';
import styles from './TransactionsHistory.module.css';

export default function TransactionsHistory() {
  const [data, setData] = useState<TransactionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [addressFilter, setAddressFilter] = useState('');

  useEffect(() => {
    loadTransactionsData();
  }, [limit, offset, addressFilter]);

  const loadTransactionsData = async () => {
    try {
      setLoading(true);
      setError(null);

      let transactionsData: TransactionsData;
      if (addressFilter.trim()) {
        transactionsData = await getTransactionsByAddress(addressFilter.trim(), limit, offset);
      } else {
        transactionsData = await getRecentTransactions(limit, offset);
      }

      setData(transactionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressFilterChange = (value: string) => {
    setAddressFilter(value);
    setOffset(0); // Reset pagination when changing filter
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setOffset(0); // Reset pagination when changing limit
  };

  const handlePageChange = (newOffset: number) => {
    setOffset(newOffset);
  };

  const formatTimestamp = (timestamp: number): string => {
    // Check if timestamp is in seconds or milliseconds
    // If timestamp is less than year 2100 in seconds (4102444800), it's likely in seconds
    const timestampMs = timestamp < 4102444800 ? timestamp * 1000 : timestamp;
    const date = new Date(timestampMs);

    // Validate date
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    return date.toLocaleString();
  };

  const formatAmount = (amount: string): string => {
    // Convert from wei to tokens (assuming 18 decimals)
    const tokens = parseFloat(amount) / 1e18;
    return formatNumber(tokens.toString());
  };

  const hasStockSplits = (tx: TransactionEntry): boolean => {
    return tx.multiplier !== undefined && tx.multiplier !== '1';
  };

  const getTransactionType = (tx: TransactionEntry): string => {
    if (tx.from_addr === '0x0000000000000000000000000000000000000000') {
      return 'Mint';
    }
    return 'Transfer';
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className="spinner"></div>
        <p className={styles.loadingText}>Loading transaction history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className={styles.error}>
          <strong>Error:</strong> {error}
        </div>
        <button className="btn btn-primary" onClick={loadTransactionsData}>
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.noData}>
        No transaction data available
      </div>
    );
  }

  const transactions = data.transactions || [];
  const totalPages = Math.ceil(data.total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className={styles.container}>
      {/* Filters and Controls */}
      <div className={styles.controls}>
        <div className={styles.filterGroup}>
          <label htmlFor="addressFilter" className={styles.filterLabel}>
            Filter by Address:
          </label>
          <input
            id="addressFilter"
            type="text"
            value={addressFilter}
            onChange={(e) => handleAddressFilterChange(e.target.value)}
            placeholder="Enter wallet address (optional)"
            className={styles.filterInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="limitSelect" className={styles.filterLabel}>
            Show per page:
          </label>
          <select
            id="limitSelect"
            value={limit}
            onChange={(e) => handleLimitChange(parseInt(e.target.value))}
            className={styles.filterSelect}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Transactions</div>
          <div className={styles.statValue}>{data.total.toLocaleString()}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Showing</div>
          <div className={styles.statValue}>
            {offset + 1}-{Math.min(offset + limit, data.total)} of {data.total.toLocaleString()}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Current Page</div>
          <div className={styles.statValue}>{currentPage} of {totalPages}</div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h3 className={styles.tableTitle}>
            Transaction History {addressFilter && `for ${formatAddress(addressFilter)}`}
          </h3>
        </div>
        <div className={styles.tableWrapper}>
          {transactions.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Block</th>
                  <th>Timestamp</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Original Amount</th>
                  <th>Adjusted Amount</th>
                  <th>Transaction Hash</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, index) => (
                  <tr key={`${tx.hash}-${index}`}>
                    <td>
                      <span className={`badge ${getTransactionType(tx) === 'Mint' ? 'badge-success' : 'badge-info'}`}>
                        {getTransactionType(tx)}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-sm">{tx.block_number.toLocaleString()}</span>
                    </td>
                    <td>
                      <span className="text-sm">{formatTimestamp(tx.timestamp)}</span>
                    </td>
                    <td>
                      <span className="font-mono text-sm">
                        {tx.from_addr === '0x0000000000000000000000000000000000000000'
                          ? 'Mint Contract'
                          : formatAddress(tx.from_addr)
                        }
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-sm">{formatAddress(tx.to_addr)}</span>
                    </td>
                    <td>
                      <span className="font-medium">{formatAmount(tx.amount)} tokens</span>
                    </td>
                    <td>
                      {tx.adjustedAmount ? (
                        <div>
                          <span className="font-medium">{formatAmount(tx.adjustedAmount)} tokens</span>
                          {hasStockSplits(tx) && (
                            <div className="text-xs text-secondary">
                              (×{tx.multiplier} from stock splits)
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="font-medium">{formatAmount(tx.amount)} tokens</span>
                      )}
                    </td>
                    <td>
                      <a
                        href={`https://amoy.polygonscan.com/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.txLink}
                      >
                        {formatAddress(tx.hash)}
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10 6.5V10.5C10 10.7652 9.89464 11.0196 9.70711 11.2071C9.51957 11.3946 9.26522 11.5 9 11.5H1.5C1.23478 11.5 0.98043 11.3946 0.792893 11.2071C0.605357 11.0196 0.5 10.7652 0.5 10.5V3C0.5 2.73478 0.605357 2.48043 0.792893 2.29289C0.98043 2.10536 1.23478 2 1.5 2H5.5M7.5 0.5H11.5M11.5 0.5V4.5M11.5 0.5L4.5 7.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={styles.noData}>
              {addressFilter
                ? `No transactions found for address ${formatAddress(addressFilter)}.`
                : 'No transactions found.'
              }
            </p>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className="btn btn-secondary"
            onClick={() => handlePageChange(0)}
            disabled={currentPage === 1}
          >
            First
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => handlePageChange(offset - limit)}
            disabled={currentPage === 1}
          >
            Previous
          </button>

          <span className={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </span>

          <button
            className="btn btn-secondary"
            onClick={() => handlePageChange(offset + limit)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => handlePageChange((totalPages - 1) * limit)}
            disabled={currentPage === totalPages}
          >
            Last
          </button>
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-lg">
        <button className="btn btn-secondary" onClick={loadTransactionsData}>
          Refresh Data
        </button>
      </div>
    </div>
  );
}
