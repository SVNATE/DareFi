/**
 * Starknet Wallet Service (WalletConnect v2)
 *
 * Connects to Starknet wallets (ArgentX, Braavos) on mobile via WalletConnect v2.
 *
 * Required setup:
 *   1. Create a project at https://cloud.reown.com
 *   2. Add WALLETCONNECT_PROJECT_ID=<your-id> to your .env file
 *   3. Install the wallet app on your device (ArgentX or Braavos mobile)
 */
import {Linking} from 'react-native';
import SignClient from '@walletconnect/sign-client';
import type {ISignClient, SessionTypes} from '@walletconnect/types';
import {WALLETCONNECT_PROJECT_ID} from '../constants/config';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StarkzapWalletSession {
  address: string;
  walletType: 'argentX' | 'braavos' | 'walletConnect';
  chainId: string;
  isConnected: boolean;
}

export interface PaymasterQuote {
  estimatedGas: string;
  gasPriceUSD: string;
  sponsoredBy: string;
  validUntil: number;
}

export interface GaslessCalldata {
  calls: {
    to: string;
    entrypoint: string;
    calldata: string[];
  }[];
  paymasterData: string;
  signature: string[];
}

export interface StakingPosition {
  amount: string;
  yieldEarned: string;
  apy: string;
  lockedUntil?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STARKNET_CHAIN = 'starknet:SN_MAIN';
const STARKNET_CHAIN_ID_HEX = '0x534e5f4d41494e';

const STARKNET_METHODS = [
  'starknet_requestAddAccounts',
  'starknet_signTypedData',
  'starknet_addInvokeTransaction',
];

// ─── Module-level state ───────────────────────────────────────────────────────

let _client: ISignClient | null = null;
let _session: SessionTypes.Struct | null = null;

// ─── Client Initialisation ────────────────────────────────────────────────────

async function _getClient(): Promise<ISignClient> {
  if (_client) {
    return _client;
  }

  if (!WALLETCONNECT_PROJECT_ID) {
    throw new Error(
      'WalletConnect Project ID is not configured.\n' +
      'Create a project at https://cloud.reown.com and add\n' +
      'WALLETCONNECT_PROJECT_ID=<your-id> to your .env file.',
    );
  }

  _client = await SignClient.init({
    projectId: WALLETCONNECT_PROJECT_ID,
    metadata: {
      name: 'DareFi',
      description: 'Decentralized dare platform on Starknet',
      url: 'https://darefi.xyz',
      icons: ['https://darefi.xyz/logo.png'],
    },
  });

  return _client;
}

// ─── Wallet Connection ────────────────────────────────────────────────────────

export async function connectWallet(
  walletType: 'argentX' | 'braavos' | 'walletConnect',
): Promise<StarkzapWalletSession> {
  const client = await _getClient();

  // Re-use an existing live session if available
  const existingSessions = client.session.getAll();
  if (existingSessions.length > 0) {
    const existing = existingSessions[existingSessions.length - 1];
    const acct = existing.namespaces?.starknet?.accounts?.[0];
    if (acct) {
      _session = existing;
      const address = acct.split(':')[2]; // caip-10: starknet:SN_MAIN:0x...
      return {address, walletType, chainId: STARKNET_CHAIN_ID_HEX, isConnected: true};
    }
  }

  // Initiate new WalletConnect pairing
  const {uri, approval} = await client.connect({
    requiredNamespaces: {
      starknet: {
        methods: STARKNET_METHODS,
        chains: [STARKNET_CHAIN],
        events: ['chainChanged', 'accountsChanged'],
      },
    },
  });

  if (!uri) {
    throw new Error('Failed to generate WalletConnect URI. Try again.');
  }

  // Open the wallet app via deep link
  const deepLink = _walletDeepLink(walletType, uri);
  const canOpen = await Linking.canOpenURL(deepLink);

  if (!canOpen) {
    const walletName =
      walletType === 'argentX' ? 'ArgentX' :
      walletType === 'braavos' ? 'Braavos' :
      'a Starknet-compatible wallet';
    throw new Error(
      `Could not open ${walletName}.\n` +
      'Please install the wallet app on your device and try again.',
    );
  }

  await Linking.openURL(deepLink);

  // Wait for the user to approve the connection in their wallet app
  _session = await approval();

  const acct = _session.namespaces?.starknet?.accounts?.[0];
  if (!acct) {
    throw new Error('Wallet connected but returned no accounts. Please try again.');
  }

  const address = acct.split(':')[2];
  return {address, walletType, chainId: STARKNET_CHAIN_ID_HEX, isConnected: true};
}

export async function disconnectWallet(): Promise<void> {
  if (_session && _client) {
    try {
      await _client.disconnect({
        topic: _session.topic,
        reason: {code: 6000, message: 'User disconnected'},
      });
    } catch {
      // Session may already be expired; ignore
    }
  }
  _session = null;
}

// ─── Message Signing ──────────────────────────────────────────────────────────

/**
 * Sign a login challenge with the connected wallet using SNIP-12 typed data.
 * Returns the wallet signature as an array of felt strings.
 */
export async function signMessage(
  walletAddress: string,
  message: string,
): Promise<string[]> {
  if (!_session) {
    throw new Error('No active wallet session. Please reconnect your wallet.');
  }

  const client = await _getClient();

  // SNIP-12 typed data for the login challenge
  const typedData = {
    types: {
      StarknetDomain: [
        {name: 'name', type: 'shortstring'},
        {name: 'version', type: 'shortstring'},
        {name: 'chainId', type: 'shortstring'},
        {name: 'revision', type: 'shortstring'},
      ],
      Message: [
        {name: 'message', type: 'string'},
      ],
    },
    primaryType: 'Message',
    domain: {
      name: 'DareFi',
      version: '1',
      chainId: 'SN_MAIN',
      revision: '1',
    },
    message: {message},
  };

  const signature = await client.request<string[]>({
    topic: _session.topic,
    chainId: STARKNET_CHAIN,
    request: {
      method: 'starknet_signTypedData',
      params: {typedData, accountAddress: walletAddress},
    },
  });

  return Array.isArray(signature) ? signature : [String(signature)];
}

// ─── Paymaster (Gasless Transactions) ─────────────────────────────────────────

/**
 * Execute a gasless transaction via your paymaster service.
 * Requires STARKZAP_API_KEY in .env and the paymaster endpoint to be live.
 */
export async function executeGasless(
  _walletAddress: string,
  _calls: GaslessCalldata['calls'],
): Promise<string> {
  // TODO: Implement paymaster call:
  // 1. POST calls to STARKZAP_CONFIG.paymasterUrl to get sponsorship signature
  // 2. Build starknet InvokeTxV3 with paymaster data
  // 3. Send via starknet_addInvokeTransaction over WalletConnect
  throw new Error('Paymaster not yet configured. Set STARKZAP_API_KEY and deploy your paymaster.');
}

export async function getPaymasterQuote(
  _calls: GaslessCalldata['calls'],
): Promise<PaymasterQuote> {
  // TODO: POST to STARKZAP_CONFIG.paymasterUrl/quote
  throw new Error('Paymaster not yet configured.');
}

// ─── Staking ──────────────────────────────────────────────────────────────────

export async function getStakingPosition(
  _walletAddress: string,
): Promise<StakingPosition> {
  // TODO: GET from STARKZAP_CONFIG.stakingUrl/position?account=...
  throw new Error('Staking service not yet configured.');
}

export async function stakeIdleFunds(
  _walletAddress: string,
  _amountUSDC: string,
): Promise<string> {
  // TODO: POST to STARKZAP_CONFIG.stakingUrl/stake
  throw new Error('Staking service not yet configured.');
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function _walletDeepLink(
  walletType: 'argentX' | 'braavos' | 'walletConnect',
  wcUri: string,
): string {
  const encoded = encodeURIComponent(wcUri);
  switch (walletType) {
    case 'argentX':
      return `argent://app/wc?uri=${encoded}`;
    case 'braavos':
      return `braavos://app/wc?uri=${encoded}`;
    default:
      // Generic WalletConnect URI — the OS will offer any installed compatible wallet
      return wcUri;
  }
}

