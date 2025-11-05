'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import styles from './Header.module.css';
import { formatAddress } from '../lib/api';

export default function Header() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

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
            <button
              className="btn btn-primary"
              onClick={() => {
                const metamaskConnector = connectors.find(c => c.id === 'injected');
                if (metamaskConnector) {
                  connect({ connector: metamaskConnector });
                }
              }}
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
