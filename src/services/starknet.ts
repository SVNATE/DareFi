/**
 * Starknet Service
 * Handles wallet connection, contract interactions, and on-chain transactions
 * via starknet.js
 */
import {Provider, RpcProvider, Contract, CallData, uint256, cairo} from 'starknet';
import {STARKNET_CONFIG, CONTRACT_ADDRESSES, APP_CONFIG} from '../constants/config';
import {WalletBalance, Transaction} from '../types';

// ─── Provider ─────────────────────────────────────────────────────────────────

let _provider: RpcProvider | null = null;

export function getProvider(): RpcProvider {
  if (!_provider) {
    _provider = new RpcProvider({
      nodeUrl: STARKNET_CONFIG.rpcUrl,
    });
  }
  return _provider;
}

// ─── Wallet Detection ─────────────────────────────────────────────────────────

export interface DetectedWallet {
  id: string;
  name: string;
  icon: string;
  isInstalled: boolean;
}

export function getAvailableWallets(): DetectedWallet[] {
  // In React Native, wallets connect via WalletConnect or native deep links
  return [
    {
      id: 'argentX',
      name: 'Argent X',
      icon: 'argent',
      isInstalled: true, // Will be checked at runtime
    },
    {
      id: 'braavos',
      name: 'Braavos',
      icon: 'braavos',
      isInstalled: true,
    },
    {
      id: 'walletConnect',
      name: 'WalletConnect',
      icon: 'walletconnect',
      isInstalled: true,
    },
  ];
}

// ─── USDC Contract ABI (partial) ─────────────────────────────────────────────

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{name: 'account', type: 'felt'}],
    outputs: [{name: 'balance', type: 'Uint256'}],
    stateMutability: 'view',
  },
  {
    name: 'approve',
    type: 'function',
    inputs: [
      {name: 'spender', type: 'felt'},
      {name: 'amount', type: 'Uint256'},
    ],
    outputs: [],
  },
  {
    name: 'allowance',
    type: 'function',
    inputs: [
      {name: 'owner', type: 'felt'},
      {name: 'spender', type: 'felt'},
    ],
    outputs: [{name: 'remaining', type: 'Uint256'}],
    stateMutability: 'view',
  },
];

// ─── Balance Queries ──────────────────────────────────────────────────────────

export async function getUSDCBalance(walletAddress: string): Promise<WalletBalance> {
  try {
    const provider = getProvider();
    const contract = new Contract(ERC20_ABI, CONTRACT_ADDRESSES.usdc, provider);
    const result = await contract.balanceOf(walletAddress);
    const rawAmount = uint256.uint256ToBN(result.balance).toString();
    // USDC has 6 decimals
    const humanAmount = (Number(rawAmount) / 1e6).toFixed(2);

    return {
      token: 'USDC',
      symbol: 'USDC',
      amount: humanAmount,
      rawAmount,
      usdValue: humanAmount,
    };
  } catch {
    return {
      token: 'USDC',
      symbol: 'USDC',
      amount: '0.00',
      rawAmount: '0',
      usdValue: '0.00',
    };
  }
}

// ─── DareEscrow ABI ───────────────────────────────────────────────────────────

export const DARE_ESCROW_ABI = [
  {
    name: 'createDare',
    type: 'function',
    inputs: [
      {name: 'title_hash', type: 'felt'},
      {name: 'metadata_uri', type: 'felt'},
      {name: 'stake_amount', type: 'Uint256'},
      {name: 'token', type: 'felt'},
      {name: 'expires_at', type: 'felt'},
      {name: 'proof_type', type: 'felt'},
    ],
    outputs: [{name: 'dare_id', type: 'felt'}],
  },
  {
    name: 'joinBet',
    type: 'function',
    inputs: [
      {name: 'dare_id', type: 'felt'},
      {name: 'prediction', type: 'felt'}, // 0 = success, 1 = fail
      {name: 'amount', type: 'Uint256'},
    ],
    outputs: [],
  },
  {
    name: 'submitProof',
    type: 'function',
    inputs: [
      {name: 'dare_id', type: 'felt'},
      {name: 'proof_uri', type: 'felt'},
      {name: 'proof_hash', type: 'felt'},
    ],
    outputs: [],
  },
  {
    name: 'vote',
    type: 'function',
    inputs: [
      {name: 'dare_id', type: 'felt'},
      {name: 'vote', type: 'felt'}, // 0 = success, 1 = fail
    ],
    outputs: [],
  },
  {
    name: 'distributeReward',
    type: 'function',
    inputs: [{name: 'dare_id', type: 'felt'}],
    outputs: [],
  },
  {
    name: 'getDare',
    type: 'function',
    inputs: [{name: 'dare_id', type: 'felt'}],
    outputs: [{name: 'dare', type: 'DareData'}],
    stateMutability: 'view',
  },
];

// ─── Transaction Helpers ──────────────────────────────────────────────────────

export function usdcToRaw(amount: string): string {
  // Convert human USDC amount (e.g. "20.00") to raw uint (6 decimals)
  const n = parseFloat(amount);
  return Math.floor(n * 1e6).toString();
}

export function rawToUsdc(raw: string): string {
  return (Number(raw) / 1e6).toFixed(2);
}

export function calculatePlatformFee(amount: string): string {
  const n = parseFloat(amount);
  return ((n * APP_CONFIG.platformFeeBps) / 10000).toFixed(2);
}

export function calculatePayout(
  creatorStake: string,
  totalBets: string,
  isCreatorWinner: boolean,
): string {
  const stake = parseFloat(creatorStake);
  const bets = parseFloat(totalBets);
  const total = stake + bets;
  const fee = total * (APP_CONFIG.platformFeeBps / 10000);
  return (total - fee).toFixed(2);
}

// ─── Format Helpers ───────────────────────────────────────────────────────────

export function shortenAddress(address: string): string {
  if (!address || address.length < 10) {return address;}
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function shortenTxHash(hash: string): string {
  if (!hash || hash.length < 10) {return hash;}
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}
