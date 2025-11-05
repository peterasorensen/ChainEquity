// Type definitions for ChainEquity backend

export interface AllowlistEntry {
  address: string;
  approved: boolean;
  timestamp: number;
}

export interface BalanceEntry {
  address: string;
  balance: string;
  timestamp: number;
}

export interface TransactionEntry {
  hash: string;
  from_addr: string;
  to_addr: string;
  amount: string;
  block_number: number;
  timestamp: number;
}

export interface CorporateActionEntry {
  id: number;
  type: 'split' | 'rename';
  data: string; // JSON stringified data
  block_number: number;
  timestamp: number;
}

export interface CapTableEntry {
  address: string;
  balance: string;
  percentage: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface MintRequest {
  to: string;
  amount: string;
}

export interface AllowlistRequest {
  address: string;
}

export interface StockSplitRequest {
  multiplier: number;
}

export interface SymbolChangeRequest {
  newName: string;
  newSymbol: string;
}

export interface RelayerSubmitRequest {
  signedTransaction: string;
}

export interface CapTableQuery {
  blockNumber?: number;
}

// Event types from the smart contract
export interface TransferEvent {
  from: string;
  to: string;
  value: bigint;
  blockNumber: bigint;
  transactionHash: string;
}

export interface MintEvent {
  to: string;
  amount: bigint;
  blockNumber: bigint;
  transactionHash: string;
}

export interface AllowlistUpdatedEvent {
  account: string;
  approved: boolean;
  blockNumber: bigint;
  transactionHash: string;
}

export interface StockSplitEvent {
  multiplier: bigint;
  blockNumber: bigint;
  transactionHash: string;
}

export interface SymbolChangedEvent {
  oldName: string;
  newName: string;
  oldSymbol: string;
  newSymbol: string;
  blockNumber: bigint;
  transactionHash: string;
}
