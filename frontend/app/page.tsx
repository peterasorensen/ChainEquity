'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import CapTable from './components/CapTable';
import AllowlistManager from './components/AllowlistManager';
import MintTokens from './components/MintTokens';
import CorporateActions from './components/CorporateActions';
import styles from './page.module.css';

export default function Home() {
  const [activeSection, setActiveSection] = useState('captable');
  const { isConnected } = useAccount();

  const renderContent = () => {
    if (!isConnected) {
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            <svg width="32" height="32" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 7H4C3.44772 7 3 7.44772 3 8V16C3 16.5523 3.44772 17 4 17H16C16.5523 17 17 16.5523 17 16V8C17 7.44772 16.5523 7 16 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 13C10.5523 13 11 12.5523 11 12C11 11.4477 10.5523 11 10 11C9.44772 11 9 11.4477 9 12C9 12.5523 9.44772 13 10 13Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className={styles.emptyStateTitle}>Connect Your Wallet</h2>
          <p className={styles.emptyStateText}>
            Please connect your wallet to access the ChainEquity admin dashboard and manage your equity platform.
          </p>
        </div>
      );
    }

    switch (activeSection) {
      case 'captable':
        return <CapTable />;
      case 'allowlist':
        return <AllowlistManager />;
      case 'mint':
        return <MintTokens />;
      case 'corporate':
        return <CorporateActions />;
      default:
        return <CapTable />;
    }
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'captable':
        return {
          title: 'Cap Table',
          description: 'View your company ownership structure and share distribution'
        };
      case 'allowlist':
        return {
          title: 'Allowlist Management',
          description: 'Manage approved addresses that can hold and transfer tokens'
        };
      case 'mint':
        return {
          title: 'Mint Tokens',
          description: 'Issue new equity tokens to approved addresses'
        };
      case 'corporate':
        return {
          title: 'Corporate Actions',
          description: 'Execute stock splits and update company information'
        };
      default:
        return {
          title: 'Dashboard',
          description: 'Manage your equity platform'
        };
    }
  };

  const sectionInfo = getSectionTitle();

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.mainContent}>
        {isConnected && (
          <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        )}
        <main className={styles.content}>
          {isConnected && (
            <div className={styles.contentHeader}>
              <h1 className={styles.contentTitle}>{sectionInfo.title}</h1>
              <p className={styles.contentDescription}>{sectionInfo.description}</p>
            </div>
          )}
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
