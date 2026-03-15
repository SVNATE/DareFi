/**
 * Wallet Store – balance, transactions, staking position
 */
import {create} from 'zustand';
import {WalletBalance, Transaction} from '../types';
import {getUSDCBalance} from '../services/starknet';
import * as StarkzapService from '../services/starkzap';
import {MOCK_TRANSACTIONS} from '../services/mockData';

interface WalletState {
  balance: WalletBalance | null;
  stakingPosition: StarkzapService.StakingPosition | null;
  transactions: Transaction[];
  isLoadingBalance: boolean;
  isLoadingTx: boolean;
  balanceError: string | null;

  fetchBalance: (walletAddress: string) => Promise<void>;
  fetchTransactions: (walletAddress: string) => Promise<void>;
  fetchStakingPosition: (walletAddress: string) => Promise<void>;
  addTransaction: (tx: Transaction) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: null,
  stakingPosition: null,
  transactions: [],
  isLoadingBalance: false,
  isLoadingTx: false,
  balanceError: null,

  fetchBalance: async (walletAddress) => {
    set({isLoadingBalance: true, balanceError: null});
    try {
      const balance = await getUSDCBalance(walletAddress);
      set({balance, isLoadingBalance: false});
    } catch (error: any) {
      set({balanceError: error?.message, isLoadingBalance: false});
    }
  },

  fetchTransactions: async (_walletAddress) => {
    set({isLoadingTx: true});
    try {
      // Use mock data; replace with: await ApiService.getTransactionHistory(walletAddress)
      await new Promise(r => setTimeout(r, 500));
      set({transactions: MOCK_TRANSACTIONS, isLoadingTx: false});
    } catch {
      set({isLoadingTx: false});
    }
  },

  fetchStakingPosition: async (walletAddress) => {
    try {
      const position = await StarkzapService.getStakingPosition(walletAddress);
      set({stakingPosition: position});
    } catch {
      // Non-critical
    }
  },

  addTransaction: (tx) =>
    set(state => ({transactions: [tx, ...state.transactions]})),
}));
