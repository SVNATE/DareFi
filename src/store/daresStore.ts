/**
 * Dares Store – manages dare feed, creation, betting, proof, voting
 */
import {create} from 'zustand';
import {
  Dare,
  CreateDareFormData,
  JoinBetFormData,
  VoteOption,
  DareStatus,
} from '../types';
import * as ApiService from '../services/api';
import * as StarkzapService from '../services/starkzap';
import {MOCK_DARES} from '../services/mockData';
import {usdcToRaw, DARE_ESCROW_ABI} from '../services/starknet';
import {CONTRACT_ADDRESSES} from '../constants/config';

interface DaresState {
  // Feed
  dares: Dare[];
  isLoadingFeed: boolean;
  hasMoreDares: boolean;
  feedPage: number;
  feedError: string | null;

  // Selected dare
  selectedDare: Dare | null;
  isLoadingDare: boolean;
  dareError: string | null;

  // Actions
  isCreating: boolean;
  isJoining: boolean;
  isSubmittingProof: boolean;
  isVoting: boolean;
  actionError: string | null;

  // Feed
  loadFeed: (refresh?: boolean) => Promise<void>;
  loadMoreFeed: () => Promise<void>;

  // Dare operations
  loadDare: (dareId: string) => Promise<void>;
  createDare: (walletAddress: string, form: CreateDareFormData) => Promise<Dare | null>;
  joinBet: (walletAddress: string, data: JoinBetFormData) => Promise<boolean>;
  submitProof: (
    walletAddress: string,
    dareId: string,
    fileUri: string,
    fileType: string,
    description?: string,
  ) => Promise<boolean>;
  vote: (walletAddress: string, dareId: string, vote: VoteOption) => Promise<boolean>;

  // Social
  likeDare: (dareId: string) => Promise<void>;

  // Cleanup
  clearActionError: () => void;
  clearSelectedDare: () => void;
}

export const useDaresStore = create<DaresState>((set, get) => ({
  dares: [],
  isLoadingFeed: false,
  hasMoreDares: true,
  feedPage: 1,
  feedError: null,

  selectedDare: null,
  isLoadingDare: false,
  dareError: null,

  isCreating: false,
  isJoining: false,
  isSubmittingProof: false,
  isVoting: false,
  actionError: null,

  // ─── Feed ────────────────────────────────────────────────────────────────

  loadFeed: async (refresh = false) => {
    const {isLoadingFeed} = get();
    if (isLoadingFeed) {return;}

    set({isLoadingFeed: true, feedError: null});
    try {
      // Use mock data for development; swap with real API in production
      await _delay(600);
      const dares = MOCK_DARES;

      if (refresh) {
        set({dares, feedPage: 1, hasMoreDares: dares.length >= 20, isLoadingFeed: false});
      } else {
        set(state => ({
          dares: [...state.dares, ...dares],
          feedPage: state.feedPage + 1,
          hasMoreDares: dares.length >= 20,
          isLoadingFeed: false,
        }));
      }
    } catch (error: any) {
      set({feedError: error?.message ?? 'Failed to load dares', isLoadingFeed: false});
    }
  },

  loadMoreFeed: async () => {
    const {hasMoreDares, isLoadingFeed} = get();
    if (!hasMoreDares || isLoadingFeed) {return;}
    await get().loadFeed(false);
  },

  // ─── Single Dare ──────────────────────────────────────────────────────────

  loadDare: async (dareId) => {
    set({isLoadingDare: true, dareError: null});
    try {
      // Use mock data; replace with: const dare = await ApiService.getDareById(dareId);
      await _delay(400);
      const dare = MOCK_DARES.find(d => d.id === dareId) ?? null;
      set({selectedDare: dare, isLoadingDare: false});
      if (!dare) {set({dareError: 'Dare not found'});}
    } catch (error: any) {
      set({dareError: error?.message ?? 'Failed to load dare', isLoadingDare: false});
    }
  },

  // ─── Create Dare ──────────────────────────────────────────────────────────

  createDare: async (walletAddress, form) => {
    set({isCreating: true, actionError: null});
    try {
      // 1. USDC approve + createDare gasless call via Starkzap
      const rawAmount = usdcToRaw(form.stakeAmount);
      const expiresAt = Math.floor(
        Date.now() / 1000 + form.durationHours * 3600,
      ).toString();

      const txHash = await StarkzapService.executeGasless(walletAddress, [
        {
          to: CONTRACT_ADDRESSES.usdc,
          entrypoint: 'approve',
          calldata: [CONTRACT_ADDRESSES.dareEscrow, rawAmount, '0'],
        },
        {
          to: CONTRACT_ADDRESSES.dareEscrow,
          entrypoint: 'createDare',
          calldata: [
            '0', // title_hash (server computes real value)
            '0', // metadata_uri
            rawAmount,
            '0',
            CONTRACT_ADDRESSES.usdc,
            expiresAt,
            form.proofType,
          ],
        },
      ]);

      // 2. Persist metadata to backend
      const dare = await ApiService.createDare(form, txHash);

      // 3. Optimistically update feed
      set(state => ({
        dares: [dare, ...state.dares],
        isCreating: false,
      }));

      return dare;
    } catch (error: any) {
      set({
        actionError: error?.message ?? 'Failed to create dare',
        isCreating: false,
      });
      return null;
    }
  },

  // ─── Join Bet ─────────────────────────────────────────────────────────────

  joinBet: async (walletAddress, data) => {
    set({isJoining: true, actionError: null});
    try {
      const rawAmount = usdcToRaw(data.betAmount);
      const predictionValue = data.prediction === 'success' ? '0' : '1';

      const txHash = await StarkzapService.executeGasless(walletAddress, [
        {
          to: CONTRACT_ADDRESSES.usdc,
          entrypoint: 'approve',
          calldata: [CONTRACT_ADDRESSES.dareEscrow, rawAmount, '0'],
        },
        {
          to: CONTRACT_ADDRESSES.dareEscrow,
          entrypoint: 'joinBet',
          calldata: [data.dareId, predictionValue, rawAmount, '0'],
        },
      ]);

      await ApiService.joinBet(data, txHash);

      // Optimistically update selectedDare
      set(state => {
        if (!state.selectedDare || state.selectedDare.id !== data.dareId) {
          return {isJoining: false};
        }
        const newBet = {
          id: `b${Date.now()}`,
          userId: walletAddress,
          username: 'You',
          prediction: data.prediction,
          amount: data.betAmount,
          placedAt: new Date().toISOString(),
          txHash,
        };
        const newPool = (
          parseFloat(state.selectedDare.totalPool) + parseFloat(data.betAmount)
        ).toFixed(2);

        return {
          isJoining: false,
          selectedDare: {
            ...state.selectedDare,
            bets: [...state.selectedDare.bets, newBet],
            betterCount: state.selectedDare.betterCount + 1,
            totalPool: newPool,
            userBet: newBet,
          },
        };
      });

      return true;
    } catch (error: any) {
      set({actionError: error?.message ?? 'Failed to join bet', isJoining: false});
      return false;
    }
  },

  // ─── Submit Proof ─────────────────────────────────────────────────────────

  submitProof: async (walletAddress, dareId, fileUri, fileType, description) => {
    set({isSubmittingProof: true, actionError: null});
    try {
      // 1. Upload file to storage
      const {uri, hash} = await ApiService.uploadProofFile(dareId, fileUri, fileType);

      // 2. Submit on-chain via Starkzap gasless
      const txHash = await StarkzapService.executeGasless(walletAddress, [
        {
          to: CONTRACT_ADDRESSES.dareEscrow,
          entrypoint: 'submitProof',
          calldata: [dareId, uri, hash],
        },
      ]);

      // 3. Record on backend
      const proof = await ApiService.submitProof(
        dareId,
        {
          type: get().selectedDare?.proofType ?? 'photo',
          uri,
          description,
        },
        txHash,
      );

      // 4. Update local dare status
      set(state => ({
        isSubmittingProof: false,
        selectedDare:
          state.selectedDare?.id === dareId
            ? {...state.selectedDare, status: 'proof_submitted' as DareStatus, proof}
            : state.selectedDare,
      }));

      return true;
    } catch (error: any) {
      set({actionError: error?.message ?? 'Failed to submit proof', isSubmittingProof: false});
      return false;
    }
  },

  // ─── Vote ─────────────────────────────────────────────────────────────────

  vote: async (walletAddress, dareId, voteOption) => {
    set({isVoting: true, actionError: null});
    try {
      const voteValue = voteOption === 'success' ? '0' : '1';

      const txHash = await StarkzapService.executeGasless(walletAddress, [
        {
          to: CONTRACT_ADDRESSES.dareEscrow,
          entrypoint: 'vote',
          calldata: [dareId, voteValue],
        },
      ]);

      await ApiService.submitVote(dareId, voteOption, txHash);

      set(state => ({
        isVoting: false,
        selectedDare:
          state.selectedDare?.id === dareId
            ? {
                ...state.selectedDare,
                userVote: voteOption,
                votesForSuccess:
                  voteOption === 'success'
                    ? state.selectedDare.votesForSuccess + 1
                    : state.selectedDare.votesForSuccess,
                votesForFail:
                  voteOption === 'fail'
                    ? state.selectedDare.votesForFail + 1
                    : state.selectedDare.votesForFail,
              }
            : state.selectedDare,
      }));

      return true;
    } catch (error: any) {
      set({actionError: error?.message ?? 'Failed to submit vote', isVoting: false});
      return false;
    }
  },

  // ─── Social ───────────────────────────────────────────────────────────────

  likeDare: async (dareId) => {
    set(state => ({
      dares: state.dares.map(d =>
        d.id === dareId
          ? {...d, isLiked: !d.isLiked, likeCount: d.isLiked ? d.likeCount - 1 : d.likeCount + 1}
          : d,
      ),
      selectedDare:
        state.selectedDare?.id === dareId
          ? {
              ...state.selectedDare,
              isLiked: !state.selectedDare.isLiked,
              likeCount: state.selectedDare.isLiked
                ? state.selectedDare.likeCount - 1
                : state.selectedDare.likeCount + 1,
            }
          : state.selectedDare,
    }));
    try {
      await ApiService.likeDare(dareId);
    } catch {
      // Revert on failure
      set(state => ({
        dares: state.dares.map(d =>
          d.id === dareId
            ? {...d, isLiked: !d.isLiked, likeCount: d.isLiked ? d.likeCount - 1 : d.likeCount + 1}
            : d,
        ),
      }));
    }
  },

  clearActionError: () => set({actionError: null}),
  clearSelectedDare: () => set({selectedDare: null}),
}));

function _delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
