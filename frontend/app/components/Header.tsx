'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useState } from 'react';
import styles from './Header.module.css';
import { formatAddress } from '../lib/api';

export default function Header() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, error } = useConnect();
  const { disconnect } = useDisconnect();
  const [showConnectors, setShowConnectors] = useState(false);

  const handleConnect = async (connectorId: string) => {
    try {
      const connector = connectors.find(c => c.id === connectorId);
      if (connector) {
        await connect({ connector });
        setShowConnectors(false);
      }
    } catch (err) {
      console.error('Failed to connect:', err);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>CE</div>
          <span className={styles.logoText}>ChainEquity</span>
        </div>

        <div className={styles.headerActions}>
          {isConnected && chain && (
            <div className={styles.networkIndicator}>
              <span className={styles.networkDot}></span>
              {chain.name}
            </div>
          )}

          {isConnected && address ? (
            <>
              <div className={styles.walletInfo}>
                <span className={styles.walletAddress}>{formatAddress(address)}</span>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => disconnect()}
              >
                Disconnect
              </button>
            </>
          ) : (
            <div className={styles.walletConnectContainer}>
              <button
                className="btn btn-primary"
                onClick={() => setShowConnectors(!showConnectors)}
              >
                Connect Wallet
              </button>

              {showConnectors && (
                <div className={styles.connectorsDropdown}>
                  {connectors.map((connector) => (
                    <button
                      key={connector.id}
                      onClick={() => handleConnect(connector.id)}
                      className={styles.connectorButton}
                    >
                      {connector.name}
                    </button>
                  ))}
                </div>
              )}

              {error && (
                <div className={styles.errorMessage}>
                  {error.message}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
