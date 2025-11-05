'use client';

import { useState, useEffect } from 'react';
import {
  getAllowlist,
  approveAddress,
  revokeAddress,
  formatAddress,
  type AllowlistEntry
} from '../lib/api';
import styles from './AllowlistManager.module.css';

export default function AllowlistManager() {
  const [allowlist, setAllowlist] = useState<AllowlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [addressInput, setAddressInput] = useState('');

  useEffect(() => {
    loadAllowlist();
  }, []);

  const loadAllowlist = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllowlist();
      setAllowlist(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load allowlist');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!addressInput) {
      setError('Please enter an address');
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      setSuccess(null);

      const result = await approveAddress(addressInput);

      if (result.success) {
        setSuccess(`Address ${formatAddress(addressInput)} approved successfully!`);
        setAddressInput('');
        await loadAllowlist();
      } else {
        setError(result.error || 'Failed to approve address');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve address');
    } finally {
      setProcessing(false);
    }
  };

  const handleRevoke = async (address: string) => {
    if (!confirm(`Are you sure you want to revoke approval for ${formatAddress(address)}?`)) {
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      setSuccess(null);

      const result = await revokeAddress(address);

      if (result.success) {
        setSuccess(`Address ${formatAddress(address)} revoked successfully!`);
        await loadAllowlist();
      } else {
        setError(result.error || 'Failed to revoke address');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke address');
    } finally {
      setProcessing(false);
    }
  };

  const approvedAddresses = allowlist.filter(entry => entry.isApproved);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className="spinner"></div>
        <p className={styles.loadingText}>Loading allowlist...</p>
      </div>
    );
  }

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

      {/* Add/Remove Address */}
      <div className={styles.actionCard}>
        <div className={styles.actionHeader}>
          <h3 className={styles.actionTitle}>Manage Address</h3>
          <p className={styles.actionDescription}>
            Approve or revoke addresses that can hold and transfer equity tokens
          </p>
        </div>

        <div className={styles.inputGroup}>
          <input
            type="text"
            className="form-input"
            placeholder="Enter wallet address (0x...)"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            disabled={processing}
          />
        </div>

        <div className={styles.buttonGroup}>
          <button
            className="btn btn-success"
            onClick={handleApprove}
            disabled={processing || !addressInput}
          >
            {processing ? 'Processing...' : 'Approve Address'}
          </button>
        </div>
      </div>

      {/* Approved Addresses List */}
      <div className={styles.listCard}>
        <div className={styles.listHeader}>
          <h3 className={styles.listTitle}>Approved Addresses</h3>
          <span className={styles.listCount}>{approvedAddresses.length}</span>
        </div>

        <div className={styles.listContent}>
          {approvedAddresses.length === 0 ? (
            <div className={styles.emptyList}>
              No approved addresses yet. Add addresses above to get started.
            </div>
          ) : (
            approvedAddresses.map((entry, index) => (
              <div key={index} className={styles.listItem}>
                <div className={styles.addressInfo}>
                  <span className={styles.address}>{entry.address}</span>
                  {entry.approvedAt && (
                    <span className={styles.timestamp}>
                      Approved on {new Date(entry.approvedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className={styles.statusBadge}>
                  <span className="badge badge-success">
                    <span className="status-dot success"></span>
                    Approved
                  </span>
                  <button
                    className="btn btn-error btn-sm"
                    onClick={() => handleRevoke(entry.address)}
                    disabled={processing}
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Refresh Button */}
      <div className="mt-lg">
        <button className="btn btn-secondary" onClick={loadAllowlist} disabled={processing}>
          Refresh List
        </button>
      </div>
    </div>
  );
}
