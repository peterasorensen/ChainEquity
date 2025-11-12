'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useAdmin } from './lib/useAdmin';
import { useAllowlist } from './lib/useAllowlist';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import CapTable from './components/CapTable';
import AllowlistManager from './components/AllowlistManager';
import MintTokens from './components/MintTokens';
import CorporateActions from './components/CorporateActions';
import TransferTokens from './components/TransferTokens';
import TransactionsHistory from './components/TransactionsHistory';
import styles from './page.module.css';

export default function Home() {
  const [activeSection, setActiveSection] = useState('captable');
  const { isConnected } = useAccount();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { isAllowlisted, loading: allowlistLoading } = useAllowlist();

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
            Please connect your wallet to access the ChainEquity platform.
          </p>
        </div>
      );
    }

    // Show loading state while checking roles
    if (adminLoading || allowlistLoading) {
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
              <path d="M12 2C6.477 2 2 6.477 2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <animateTransform
                  attributeName="transform"
                  attributeType="XML"
                  type="rotate"
                  from="0 12 12"
                  to="360 12 12"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </path>
            </svg>
          </div>
          <h2 className={styles.emptyStateTitle}>Checking Access...</h2>
          <p className={styles.emptyStateText}>
            Please wait while we verify your permissions.
          </p>
        </div>
      );
    }

    // Not allowlisted view
    if (!isAdmin && !isAllowlisted) {
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            <svg width="32" height="32" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 6V10M10 14H10.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className={styles.emptyStateTitle}>Access Restricted</h2>
          <p className={styles.emptyStateText}>
            You must be allowlisted to access this platform. Please contact the administrator.
          </p>
        </div>
      );
    }

    // Render content based on active section
    switch (activeSection) {
      case 'captable':
        return <CapTable />;
      case 'allowlist':
        return isAdmin ? <AllowlistManager /> : <CapTable />;
      case 'mint':
        return isAdmin ? <MintTokens /> : <CapTable />;
      case 'corporate':
        return isAdmin ? <CorporateActions /> : <CapTable />;
      case 'transfer':
        return <TransferTokens />;
      case 'transactions':
        return <TransactionsHistory />;
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
      case 'transfer':
        return {
          title: 'Transfer Tokens',
          description: 'Send equity tokens to other approved addresses'
        };
      case 'transactions':
        return {
          title: 'Transaction History',
          description: 'View recent blockchain transactions and activity'
        };
      default:
        return {
          title: 'Dashboard',
          description: 'Manage your equity platform'
        };
    }
  };

  // Determine user role for sidebar
  const getUserRole = (): 'admin' | 'user' | 'none' => {
    if (isAdmin) return 'admin';
    if (isAllowlisted) return 'user';
    return 'none';
  };

  const sectionInfo = getSectionTitle();

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.mainContent}>
        {isConnected && !adminLoading && !allowlistLoading && (isAdmin || isAllowlisted) && (
          <Sidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            userRole={getUserRole()}
          />
        )}
        <main className={styles.content}>
          {isConnected && !adminLoading && !allowlistLoading && (isAdmin || isAllowlisted) && (
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
