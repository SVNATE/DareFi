/**
 * API Service
 * Handles off-chain metadata, proof storage, notifications.
 */
import axios, {AxiosInstance} from 'axios';
import {API_BASE_URL} from '../constants/config';
import {
  Dare,
  User,
  Comment,
  LeaderboardEntry,
  LeaderboardTab,
  CreateDareFormData,
  JoinBetFormData,
  ApiResponse,
  PaginatedResponse,
  DareProof,
  Transaction,
} from '../types';

// ─── Axios Instance ───────────────────────────────────────────────────────────

let _authToken: string | null = null;

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

apiClient.interceptors.request.use(config => {
  if (_authToken) {
    config.headers.Authorization = `Bearer ${_authToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  response => response,
  error => {
    const msg = error?.response?.data?.message ?? error.message ?? 'Network error';
    throw new Error(msg);
  },
);

export function setAuthToken(token: string | null): void {
  _authToken = token;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function loginWithWallet(
  walletAddress: string,
  signature: string[],
): Promise<{user: User; token: string}> {
  const response = await apiClient.post<ApiResponse<{user: User; token: string}>>(
    '/auth/wallet-login',
    {walletAddress, signature},
  );
  return response.data.data;
}

export async function createUser(
  walletAddress: string,
  username: string,
): Promise<{user: User; token: string}> {
  const response = await apiClient.post<ApiResponse<{user: User; token: string}>>(
    '/auth/create-user',
    {walletAddress, username},
  );
  return response.data.data;
}

export async function checkUsername(username: string): Promise<boolean> {
  const response = await apiClient.get<ApiResponse<{available: boolean}>>(
    `/auth/check-username/${encodeURIComponent(username)}`,
  );
  return response.data.data.available;
}

// ─── Dares ────────────────────────────────────────────────────────────────────

export async function getDares(
  page = 1,
  limit = 20,
  filter?: 'open' | 'active' | 'completed',
): Promise<PaginatedResponse<Dare>> {
  const params = new URLSearchParams({page: String(page), limit: String(limit)});
  if (filter) {params.append('status', filter);}
  const response = await apiClient.get<ApiResponse<PaginatedResponse<Dare>>>(
    `/dares?${params}`,
  );
  return response.data.data;
}

export async function getDareById(dareId: string): Promise<Dare> {
  const response = await apiClient.get<ApiResponse<Dare>>(`/dares/${dareId}`);
  return response.data.data;
}

export async function createDare(
  formData: CreateDareFormData,
  txHash: string,
): Promise<Dare> {
  const response = await apiClient.post<ApiResponse<Dare>>('/dares', {
    ...formData,
    txHash,
  });
  return response.data.data;
}

export async function joinBet(
  data: JoinBetFormData,
  txHash: string,
): Promise<void> {
  await apiClient.post(`/dares/${data.dareId}/bets`, {
    prediction: data.prediction,
    amount: data.betAmount,
    txHash,
  });
}

export async function submitProof(
  dareId: string,
  proof: {type: string; uri: string; description?: string},
  txHash: string,
): Promise<DareProof> {
  const response = await apiClient.post<ApiResponse<DareProof>>(
    `/dares/${dareId}/proof`,
    {proof, txHash},
  );
  return response.data.data;
}

export async function submitVote(
  dareId: string,
  vote: 'success' | 'fail',
  txHash: string,
): Promise<void> {
  await apiClient.post(`/dares/${dareId}/votes`, {vote, txHash});
}

export async function getDareComments(dareId: string): Promise<Comment[]> {
  const response = await apiClient.get<ApiResponse<Comment[]>>(
    `/dares/${dareId}/comments`,
  );
  return response.data.data;
}

export async function addComment(dareId: string, text: string): Promise<Comment> {
  const response = await apiClient.post<ApiResponse<Comment>>(
    `/dares/${dareId}/comments`,
    {text},
  );
  return response.data.data;
}

export async function likeDare(dareId: string): Promise<void> {
  await apiClient.post(`/dares/${dareId}/like`);
}

// ─── Users / Social ──────────────────────────────────────────────────────────

export async function getUserById(userId: string): Promise<User> {
  const response = await apiClient.get<ApiResponse<User>>(`/users/${userId}`);
  return response.data.data;
}

export async function getUserDares(userId: string): Promise<Dare[]> {
  const response = await apiClient.get<ApiResponse<Dare[]>>(`/users/${userId}/dares`);
  return response.data.data;
}

export async function followUser(userId: string): Promise<void> {
  await apiClient.post(`/users/${userId}/follow`);
}

export async function unfollowUser(userId: string): Promise<void> {
  await apiClient.delete(`/users/${userId}/follow`);
}

export async function updateProfile(
  updates: Partial<Pick<User, 'username' | 'bio' | 'avatar'>>,
): Promise<User> {
  const response = await apiClient.patch<ApiResponse<User>>('/users/me', updates);
  return response.data.data;
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export async function getLeaderboard(
  tab: LeaderboardTab,
  page = 1,
): Promise<LeaderboardEntry[]> {
  const response = await apiClient.get<ApiResponse<LeaderboardEntry[]>>(
    `/leaderboard?tab=${tab}&page=${page}`,
  );
  return response.data.data;
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function getTransactionHistory(
  walletAddress: string,
): Promise<Transaction[]> {
  const response = await apiClient.get<ApiResponse<Transaction[]>>(
    `/transactions/${walletAddress}`,
  );
  return response.data.data;
}

// ─── File Upload ──────────────────────────────────────────────────────────────

export async function uploadProofFile(
  dareId: string,
  fileUri: string,
  fileType: string,
  onProgress?: (progress: number) => void,
): Promise<{uri: string; hash: string}> {
  const formData = new FormData();
  const fileName = fileUri.split('/').pop() ?? 'proof';
  formData.append('file', {uri: fileUri, type: fileType, name: fileName} as any);
  formData.append('dareId', dareId);

  const response = await apiClient.post<ApiResponse<{uri: string; hash: string}>>(
    '/uploads/proof',
    formData,
    {
      headers: {'Content-Type': 'multipart/form-data'},
      onUploadProgress: (evt: any) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded * 100) / evt.total));
        }
      },
    },
  );
  return response.data.data;
}
