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

  useEffect(() => {
    loadCapTableData();
  }, []);

  const loadCapTableData = async () => {
    try {
      setLoading(true);
      setError(null);
      const capTableData = await getCapTableData();
      setData(capTableData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cap table data');
    } finally {
      setLoading(false);
    }
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
        <button className="btn btn-primary" onClick={loadCapTableData}>
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

  const ownershipChartData = data.ownershipData || [];
  const totalRaised = parseFloat(data.totalRaised || '0');

  return (
    <div className={styles.container}>
      {/* Stats Overview */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Supply</div>
          <div className={styles.statValue}>{formatNumber(data.totalSupply)}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Raised</div>
          <div className={styles.statValue}>{formatCurrency(totalRaised)}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Share Classes</div>
          <div className={styles.statValue}>{data.shareClasses.length}</div>
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
            {data.shareClasses.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.shareClasses.map(sc => ({
                      name: sc.name,
                      value: parseFloat(sc.amountRaised || '0')
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.shareClasses.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className={styles.noData}>No fundraising data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Share Classes Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h3 className={styles.tableTitle}>Share Classes</h3>
        </div>
        <div className={styles.tableWrapper}>
          <table className="table">
            <thead>
              <tr>
                <th>Share Class</th>
                <th>Authorized Shares</th>
                <th>Outstanding Shares</th>
                <th>Ownership %</th>
                <th>Fully Diluted</th>
                <th>Amount Raised</th>
              </tr>
            </thead>
            <tbody>
              {data.shareClasses.map((shareClass, index) => (
                <tr key={index}>
                  <td>
                    <span className="font-medium">{shareClass.name}</span>
                  </td>
                  <td>{formatNumber(shareClass.authorizedShares)}</td>
                  <td>{formatNumber(shareClass.outstandingShares)}</td>
                  <td>
                    <span className="badge badge-info">
                      {shareClass.ownershipPercentage.toFixed(2)}%
                    </span>
                  </td>
                  <td>{formatNumber(shareClass.fullyDilutedCount)}</td>
                  <td className="font-semibold">
                    {formatCurrency(parseFloat(shareClass.amountRaised || '0'))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="mt-lg">
        <button className="btn btn-secondary" onClick={loadCapTableData}>
          Refresh Data
        </button>
      </div>
    </div>
  );
}
