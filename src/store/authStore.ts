/**
 * Auth Store – manages wallet session and user profile
 */
import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {User} from '../types';
import * as StarkzapService from '../services/starkzap';
import * as ApiService from '../services/api';
import {setAuthToken} from '../services/api';

interface AuthState {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  walletAddress: string | null;
  walletType: 'argentX' | 'braavos' | 'walletConnect' | null;
  user: User | null;
  error: string | null;

  // Actions
  connectWallet: (walletType: 'argentX' | 'braavos' | 'walletConnect') => Promise<void>;
  createUsername: (username: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrateFromStorage: () => Promise<void>;
  clearError: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const STORAGE_KEYS = {
  walletAddress: '@darefi:walletAddress',
  walletType: '@darefi:walletType',
  authToken: '@darefi:authToken',
  user: '@darefi:user',
};

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: false,
  walletAddress: null,
  walletType: null,
  user: null,
  error: null,

  connectWallet: async (walletType) => {
    set({isLoading: true, error: null});
    try {
      // 1. Connect via Starkzap
      const session = await StarkzapService.connectWallet(walletType);

      // 2. Sign a login message for authentication
      const message = `DareFi login: ${Date.now()}`;
      const signature = await StarkzapService.signMessage(session.address, message);

      // 3. Authenticate with backend
      let authResult: {user: User; token: string};
      try {
        authResult = await ApiService.loginWithWallet(session.address, signature);
      } catch (error: any) {
        // New wallet not registered yet -> continue to username onboarding.
        if (_isWalletNotRegisteredError(error)) {
          await AsyncStorage.setItem(STORAGE_KEYS.walletAddress, session.address);
          await AsyncStorage.setItem(STORAGE_KEYS.walletType, walletType);

          set({
            walletAddress: session.address,
            walletType,
            isLoading: false,
            isAuthenticated: false,
            error: null,
          });
          return;
        }

        throw error;
      }

      setAuthToken(authResult.token);
      await _persistSession(session.address, walletType, authResult.token, authResult.user);

      set({
        walletAddress: session.address,
        walletType,
        user: authResult.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error?.message ?? 'Failed to connect wallet',
        isLoading: false,
      });
    }
  },

  createUsername: async (username) => {
    const {walletAddress, walletType} = get();
    if (!walletAddress) {
      set({error: 'No wallet connected'});
      return;
    }

    set({isLoading: true, error: null});
    try {
      const result = await ApiService.createUser(walletAddress, username);

      setAuthToken(result.token);
      await _persistSession(walletAddress, walletType!, result.token, result.user);

      set({
        user: result.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error?.message ?? 'Failed to create username',
        isLoading: false,
      });
    }
  },

  logout: async () => {
    await StarkzapService.disconnectWallet();
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    setAuthToken(null);
    set({
      isAuthenticated: false,
      walletAddress: null,
      walletType: null,
      user: null,
      error: null,
    });
  },

  hydrateFromStorage: async () => {
    try {
      const [walletAddress, walletType, authToken, userJson] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.walletAddress),
        AsyncStorage.getItem(STORAGE_KEYS.walletType),
        AsyncStorage.getItem(STORAGE_KEYS.authToken),
        AsyncStorage.getItem(STORAGE_KEYS.user),
      ]);

      if (walletAddress && authToken && userJson) {
        const user: User = JSON.parse(userJson);
        setAuthToken(authToken);
        set({
          walletAddress,
          walletType: walletType as any,
          user,
          isAuthenticated: true,
        });
      } else if (walletAddress) {
        // Has wallet but no username yet
        set({walletAddress, walletType: walletType as any});
      }
    } catch {
      // Ignore storage errors
    }
  },

  clearError: () => set({error: null}),

  updateUser: (updates) =>
    set(state => ({
      user: state.user ? {...state.user, ...updates} : null,
    })),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function _persistSession(
  walletAddress: string,
  walletType: string,
  token: string,
  user: User,
): Promise<void> {
  await AsyncStorage.multiSet([
    [STORAGE_KEYS.walletAddress, walletAddress],
    [STORAGE_KEYS.walletType, walletType],
    [STORAGE_KEYS.authToken, token],
    [STORAGE_KEYS.user, JSON.stringify(user)],
  ]);
}

function _isWalletNotRegisteredError(error: any): boolean {
  const status = error?.status ?? error?.response?.status;
  if (status === 404) {
    return true;
  }

  const message = String(error?.message ?? '').toLowerCase();
  return (
    message.includes('not found')
    || message.includes('not registered')
    || message.includes('user does not exist')
    || message.includes('wallet does not exist')
  );
}
