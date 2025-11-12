'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { getCapTableData, formatNumber, formatCurrency, type CapTableData } from '../lib/api';
import styles from './CapTable.module.css';

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'];

export default function CapTable() {
  const [data, setData] = useState<CapTableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blockNumber, setBlockNumber] = useState<string>('');
  const [historicalMode, setHistoricalMode] = useState(false);

  useEffect(() => {
    loadCapTableData();
  }, []);

  const loadCapTableData = async (blockNum?: number) => {
    try {
      setLoading(true);
      setError(null);
      const capTableData = await getCapTableData(blockNum);
      setData(capTableData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cap table data');
    } finally {
      setLoading(false);
    }
  };

  const handleHistoricalQuery = () => {
    const blockNum = parseInt(blockNumber, 10);
    if (isNaN(blockNum) || blockNum < 0) {
      setError('Please enter a valid block number');
      return;
    }
    setHistoricalMode(true);
    loadCapTableData(blockNum);
  };

  const handleCurrentQuery = () => {
    setHistoricalMode(false);
    setBlockNumber('');
    loadCapTableData();
  };

  const exportToCSV = () => {
    if (!data) return;

    const fromWei = (weiValue: string): number => {
      return parseFloat(weiValue) / 1e18;
    };

    // Create CSV header
    const headers = ['Wallet Address', 'Balance', 'Ownership %'];

    // Create CSV rows
    const rows = data.entries.map(entry => [
      entry.address,
      fromWei(entry.balance).toString(),
      entry.percentage.toFixed(2)
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `cap-table-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    if (!data) return;

    const fromWei = (weiValue: string): number => {
      return parseFloat(weiValue) / 1e18;
    };

    // Create export data structure
    const exportData = {
      exportDate: new Date().toISOString(),
      summary: {
        totalSupply: fromWei(data.totalShares || '0'),
        totalRaised: parseFloat(data.totalRaised || '0'),
        totalHolders: data.holders || 0
      },
      holders: data.entries.map(entry => ({
        address: entry.address,
        balance: fromWei(entry.balance),
        ownershipPercentage: parseFloat(entry.percentage.toFixed(2))
      }))
    };

    // Create and download file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `cap-table-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className="spinner"></div>
        <p className={styles.loadingText}>Loading cap table data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className={styles.error}>
          <strong>Error:</strong> {error}
        </div>
        <button className="btn btn-primary" onClick={() => loadCapTableData()}>
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.noData}>
        No cap table data available
      </div>
    );
  }

  const entries = data.entries || [];

  // Convert from wei (10^18) to tokens
  const fromWei = (weiValue: string): number => {
    return parseFloat(weiValue) / 1e18;
  };

  const ownershipChartData = entries.map(entry => ({
    name: entry.address.substring(0, 6) + '...' + entry.address.substring(38),
    value: entry.percentage, // Use percentage from backend
    tokens: fromWei(entry.balance)
  }));
  const totalRaised = parseFloat(data.totalRaised || '0');
  const totalShares = fromWei(data.totalShares || '0');

  return (
    <div className={styles.container}>
      {/* Historical Query Controls */}
      <div className={styles.controls}>
        <div className={styles.queryMode}>
          <button
            className={`btn ${!historicalMode ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handleCurrentQuery}
          >
            Current Cap Table
          </button>
          <button
            className={`btn ${historicalMode ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setHistoricalMode(true)}
          >
            Historical Query
          </button>
        </div>

        {historicalMode && (
          <div className={styles.historicalControls}>
            <div className={styles.inputGroup}>
              <label htmlFor="blockNumber" className={styles.inputLabel}>
                Block Number:
              </label>
              <input
                id="blockNumber"
                type="number"
                value={blockNumber}
                onChange={(e) => setBlockNumber(e.target.value)}
                placeholder="Enter block number"
                className={styles.inputField}
                min="0"
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={handleHistoricalQuery}
              disabled={!blockNumber.trim()}
            >
              Query Historical Data
            </button>
          </div>
        )}

        {historicalMode && (
          <div className={styles.historicalNote}>
            <span className="text-sm text-secondary">
              Showing cap table as it existed at block {blockNumber}
            </span>
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Supply</div>
          <div className={styles.statValue}>{formatNumber(totalShares)}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Raised</div>
          <div className={styles.statValue}>{formatCurrency(totalRaised)}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Holders</div>
          <div className={styles.statValue}>{data.holders || 0}</div>
        </div>
      </div>

      {/* Charts */}
      <div className={styles.chartsGrid}>
        {/* Ownership Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Ownership Distribution</h3>
            <p className={styles.chartSubtitle}>Fully diluted shares by class</p>
          </div>
          <div className={styles.chartContainer}>
            {ownershipChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ownershipChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value.toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {ownershipChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className={styles.noData}>No ownership data available</p>
            )}
          </div>
        </div>

        {/* Amount Raised Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Amount Raised</h3>
            <p className={styles.chartSubtitle}>Capital raised by share class</p>
          </div>
          <div className={styles.chartContainer}>
            {entries.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={entries.map(entry => ({
                      name: entry.address.substring(0, 6) + '...' + entry.address.substring(38),
                      value: fromWei(entry.balance),
                      percentage: entry.percentage
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${formatNumber(entry.value.toString())} (${entry.percentage.toFixed(1)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {entries.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatNumber(value.toString()) + ' tokens'} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className={styles.noData}>No token holders yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Token Holders Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h3 className={styles.tableTitle}>Token Holders</h3>
          <div className={styles.exportButtons}>
            <button className="btn btn-secondary" onClick={exportToCSV} disabled={!data || entries.length === 0}>
              Export CSV
            </button>
            <button className="btn btn-secondary" onClick={exportToJSON} disabled={!data || entries.length === 0}>
              Export JSON
            </button>
          </div>
        </div>
        <div className={styles.tableWrapper}>
          {entries.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Wallet Address</th>
                  <th>Balance</th>
                  <th>Ownership %</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr key={index}>
                    <td>
                      <span className="font-medium">{entry.address}</span>
                    </td>
                    <td>{formatNumber(fromWei(entry.balance).toString())}</td>
                    <td>
                      <span className="badge badge-info">
                        {entry.percentage.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={styles.noData}>No token holders yet. Mint tokens to get started!</p>
          )}
        </div>
      </div>

      {/* Refresh Button */}
      <div className="mt-lg">
        <button className="btn btn-secondary" onClick={() => loadCapTableData()}>
          Refresh Data
        </button>
      </div>
    </div>
  );
}
