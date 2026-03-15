// ─── User Types ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  walletAddress: string;
  username: string;
  avatar?: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  daresCreated: number;
  daresCompleted: number;
  daresWon: number;
  totalWinnings: string; // USDC amount as string
  successRate: number;   // 0–100
  reputation: number;    // XP points
  createdAt: string;
  isFollowing?: boolean;
}

// ─── Dare Types ──────────────────────────────────────────────────────────────

export type DareStatus =
  | 'open'          // Accepting bets
  | 'active'        // In progress, creator working on it
  | 'proof_submitted' // Proof uploaded, awaiting vote
  | 'voting'        // Voting in progress
  | 'completed'     // Creator won
  | 'failed'        // Creator failed
  | 'cancelled'     // Cancelled before start
  | 'disputed';     // Under dispute

export type ProofType = 'video' | 'photo' | 'gps' | 'health' | 'text';

export type DareCategory = 'fitness' | 'diet' | 'gaming' | 'social' | 'skill' | 'other';

export type DareVisibility = 'public' | 'friends';

export type VoteOption = 'success' | 'fail';

export interface DareProof {
  id: string;
  type: ProofType;
  uri: string;          // IPFS or server URI
  description?: string;
  submittedAt: string;
  hash?: string;        // IPFS hash
}

export interface Vote {
  userId: string;
  username: string;
  vote: VoteOption;
  votedAt: string;
}

export interface Bet {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  prediction: VoteOption; // 'success' | 'fail'
  amount: string;          // USDC amount
  placedAt: string;
  txHash?: string;
}

export interface Dare {
  id: string;
  creator: User;
  title: string;
  description: string;
  category: DareCategory;
  status: DareStatus;
  visibility: DareVisibility;

  // Financial
  creatorStake: string;  // USDC amount as string (e.g. "20.00")
  totalPool: string;     // Total pool including creator stake + bets
  token: string;         // 'USDC'

  // Timing
  createdAt: string;
  startsAt: string;
  expiresAt: string;    // Dare deadline
  votingEndsAt?: string;

  // Proof
  proofType: ProofType;
  proof?: DareProof;

  // Participants
  bets: Bet[];
  betterCount: number;
  successPool: string;  // Total staked on success
  failPool: string;     // Total staked on fail

  // Voting
  votes: Vote[];
  votesForSuccess: number;
  votesForFail: number;

  // Result
  winner?: VoteOption;
  rewardTxHash?: string;

  // Social
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked?: boolean;
  userBet?: Bet;       // Current user's bet if any
  userVote?: VoteOption;
}

export interface Comment {
  id: string;
  dareId: string;
  user: User;
  text: string;
  createdAt: string;
  likeCount: number;
  isLiked?: boolean;
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  user: User;
  metric: string; // formatted value for the selected leaderboard tab
}

export type LeaderboardTab = 'completions' | 'winnings' | 'successRate';

// ─── Wallet ─────────────────────────────────────────────────────────────────

export interface WalletBalance {
  token: string;
  symbol: string;
  amount: string;     // Human-readable
  rawAmount: string;  // Raw (uint256)
  usdValue: string;
}

export interface Transaction {
  hash: string;
  type: 'createDare' | 'joinBet' | 'submitProof' | 'receiveReward' | 'withdraw';
  amount: string;
  token: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  dareId?: string;
  dareTitle?: string;
}

// ─── Navigation Params ───────────────────────────────────────────────────────

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  CreateUsername: {walletAddress: string};
};

export type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  CreateDare: undefined;
  Leaderboard: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  Feed: undefined;
  DareDetails: {dareId: string};
  ProofUpload: {dareId: string};
  Voting: {dareId: string};
  Results: {dareId: string};
  UserProfile: {userId: string};
  Notifications: undefined;
};

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ─── Form Types ──────────────────────────────────────────────────────────────

export interface CreateDareFormData {
  title: string;
  description: string;
  category: DareCategory;
  stakeAmount: string;
  proofType: ProofType;
  durationHours: number;
  visibility: DareVisibility;
}

export interface JoinBetFormData {
  dareId: string;
  prediction: VoteOption;
  betAmount: string;
}
