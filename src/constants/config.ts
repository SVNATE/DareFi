const ENV = (globalThis as {process?: {env?: Record<string, string | undefined>}})
  .process?.env ?? {};

// Starknet / Starkzap Configuration
export const STARKNET_CONFIG = {
  network: 'mainnet', // or 'sepolia' for testnet
  rpcUrl: 'https://starknet-mainnet.public.blastapi.io',
  testnetRpcUrl: 'https://starknet-sepolia.public.blastapi.io',
  chainId: '0x534e5f4d41494e', // SN_MAIN
  testnetChainId: '0x534e5f5345504f4c4941', // SN_SEPOLIA
};

export const CONTRACT_ADDRESSES = {
  dareEscrow: '0x01234567890abcdef01234567890abcdef01234567890abcdef01234567890abcdef',
  usdc: '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8',
};

export const STARKZAP_CONFIG = {
  apiKey: ENV.STARKZAP_API_KEY ?? '',
  paymasterUrl: 'https://paymaster.starkzap.io/v1',
  stakingUrl: 'https://staking.starkzap.io/v1',
};

/**
 * WalletConnect Project ID
 * Create a project at https://cloud.reown.com and add the ID to your .env:
 *   WALLETCONNECT_PROJECT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 */
export const WALLETCONNECT_PROJECT_ID: string = ENV.WALLETCONNECT_PROJECT_ID ?? '';

export const APP_CONFIG = {
  minStakeUSDC: 1,      // $1 minimum stake
  maxStakeUSDC: 10000,  // $10,000 maximum stake
  platformFeeBps: 150,  // 1.5% platform fee
  votingDurationHours: 6,
  minChallengeDurationHours: 1,
  maxChallengeDurationDays: 30,
  maxParticipants: 100,
};

export const API_BASE_URL = 'https://api.darefi.xyz/v1';

export const PROOF_TYPES = [
  {id: 'video', label: 'Video', icon: 'video-outline'},
  {id: 'photo', label: 'Photo', icon: 'camera-outline'},
  {id: 'gps', label: 'GPS Screenshot', icon: 'map-marker-outline'},
  {id: 'health', label: 'Health Tracker', icon: 'heart-pulse'},
  {id: 'text', label: 'Text Description', icon: 'text-outline'},
] as const;

export const DARE_CATEGORIES = [
  {id: 'fitness', label: 'Fitness', icon: '🏃', color: '#00D4AA'},
  {id: 'diet', label: 'Diet & Health', icon: '🥗', color: '#FFB020'},
  {id: 'gaming', label: 'Gaming', icon: '🎮', color: '#7C5CFC'},
  {id: 'social', label: 'Social', icon: '👥', color: '#FF5E7A'},
  {id: 'skill', label: 'Skill', icon: '⚡', color: '#00B8D9'},
  {id: 'other', label: 'Other', icon: '🎯', color: '#B0AECE'},
] as const;

export const SUPPORTED_TOKENS = [
  {symbol: 'USDC', name: 'USD Coin', decimals: 6, contractAddress: CONTRACT_ADDRESSES.usdc},
] as const;
