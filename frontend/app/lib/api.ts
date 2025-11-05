// API Integration for ChainEquity Backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Type Definitions
export interface ShareClass {
  name: string;
  authorizedShares: string;
  outstandingShares: string;
  ownershipPercentage: number;
  fullyDilutedCount: string;
  amountRaised: string;
}

export interface CapTableData {
  totalSupply: string;
  shareClasses: ShareClass[];
  ownershipData: {
    name: string;
    value: number;
  }[];
  totalRaised: string;
}

export interface AllowlistEntry {
  address: string;
  isApproved: boolean;
  approvedAt?: string;
}

export interface TokenInfo {
  name: string;
  symbol: string;
  totalSupply: string;
  currentMultiplier: number;
}

export interface MintRequest {
  recipient: string;
  amount: string;
}

export interface SplitRequest {
  multiplier: number;
}

export interface SymbolChangeRequest {
  newName: string;
  newSymbol: string;
}

export interface TransactionResponse {
  success: boolean;
  transactionHash?: string;
  message?: string;
  error?: string;
}

// Error handling wrapper
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// Cap Table API
export async function getCapTableData(): Promise<CapTableData> {
  const response = await fetch(`${API_BASE_URL}/api/cap-table`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleResponse<CapTableData>(response);
}

// Token Info API
export async function getTokenInfo(): Promise<TokenInfo> {
  const response = await fetch(`${API_BASE_URL}/api/token/info`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleResponse<TokenInfo>(response);
}

// Allowlist APIs
export async function getAllowlist(): Promise<AllowlistEntry[]> {
  const response = await fetch(`${API_BASE_URL}/api/allowlist`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const result = await handleResponse<{ success: boolean; data: { addresses: string[] } }>(response);
  // Convert addresses array to AllowlistEntry format
  return result.data.addresses.map(address => ({
    address,
    isApproved: true, // All addresses in the list are approved
    timestamp: Date.now()
  }));
}

export async function checkAllowlist(address: string): Promise<{ isApproved: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/allowlist/${address}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleResponse<{ isApproved: boolean }>(response);
}

export async function approveAddress(address: string): Promise<TransactionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/allowlist/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ address }),
  });
  return handleResponse<TransactionResponse>(response);
}

export async function revokeAddress(address: string): Promise<TransactionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/allowlist/revoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ address }),
  });
  return handleResponse<TransactionResponse>(response);
}

// Minting API
export async function mintTokens(data: MintRequest): Promise<TransactionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/mint`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse<TransactionResponse>(response);
}

// Corporate Actions APIs
export async function executeStockSplit(data: SplitRequest): Promise<TransactionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/corporate-actions/split`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse<TransactionResponse>(response);
}

export async function changeSymbol(data: SymbolChangeRequest): Promise<TransactionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/corporate-actions/change-symbol`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse<TransactionResponse>(response);
}

// Balance check
export async function getBalance(address: string): Promise<{ balance: string }> {
  const response = await fetch(`${API_BASE_URL}/api/balance/${address}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return handleResponse<{ balance: string }>(response);
}

// Utility functions
export function formatNumber(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}
