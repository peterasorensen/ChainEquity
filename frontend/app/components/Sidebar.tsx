'use client';

import { useState } from 'react';
import styles from './Sidebar.module.css';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  userRole: 'admin' | 'user' | 'none';
}

export default function Sidebar({ activeSection, onSectionChange, userRole }: SidebarProps) {
  // Define menu items based on user role
  const isAdmin = userRole === 'admin';
  const isUser = userRole === 'user';

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        {/* Cap Table - Available to both admin and user */}
        <div
          className={`${styles.navItem} ${activeSection === 'captable' ? styles.active : ''}`}
          onClick={() => onSectionChange('captable')}
        >
          <div className={styles.navIcon}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 15C12.7614 15 15 12.7614 15 10C15 7.23858 12.7614 5 10 5C7.23858 5 5 7.23858 5 10C5 12.7614 7.23858 15 10 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 5V10L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          Cap Table
        </div>

        {/* Transfer - Available to both admin and user */}
        <div
          className={`${styles.navItem} ${activeSection === 'transfer' ? styles.active : ''}`}
          onClick={() => onSectionChange('transfer')}
        >
          <div className={styles.navIcon}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 7L16 10M16 10L13 13M16 10H4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          Transfer
        </div>

        {/* Admin-only menu items */}
        {isAdmin && (
          <>
            <div
              className={`${styles.navItem} ${activeSection === 'allowlist' ? styles.active : ''}`}
              onClick={() => onSectionChange('allowlist')}
            >
              <div className={styles.navIcon}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 7H4C3.44772 7 3 7.44772 3 8V16C3 16.5523 3.44772 17 4 17H16C16.5523 17 17 16.5523 17 16V8C17 7.44772 16.5523 7 16 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 13C10.5523 13 11 12.5523 11 12C11 11.4477 10.5523 11 10 11C9.44772 11 9 11.4477 9 12C9 12.5523 9.44772 13 10 13Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6.5 7V5C6.5 3.89543 7.39543 3 8.5 3H11.5C12.6046 3 13.5 3.89543 13.5 5V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              Allowlist
            </div>

            <div
              className={`${styles.navItem} ${activeSection === 'mint' ? styles.active : ''}`}
              onClick={() => onSectionChange('mint')}
            >
              <div className={styles.navIcon}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 5V15M5 10H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </div>
              Mint Tokens
            </div>

            <div
              className={`${styles.navItem} ${activeSection === 'corporate' ? styles.active : ''}`}
              onClick={() => onSectionChange('corporate')}
            >
              <div className={styles.navIcon}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8V16M8 8V16M5 8H15M4 4H16C16.5523 4 17 4.44772 17 5V7C17 7.55228 16.5523 8 16 8H4C3.44772 8 3 7.55228 3 7V5C3 4.44772 3.44772 4 4 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              Corporate Actions
            </div>
          </>
        )}
      </nav>
    </aside>
  );
}
