/// DareFi — DareEscrow Contract
///
/// Lifecycle:
///   createDare → joinBet → submitProof → vote (by community) → distributeReward
///
/// All monetary amounts are in USDC (6 decimals, e.g. 1 USDC = 1_000_000).
/// Platform fee: 150 bps (1.5 %). The remaining 98.5 % goes to winners.
///   Win pool  = stake + all "success" bets
///   Fail pool = all "fail" bets
///
/// Winner determination: simple majority of community votes.
///   Dare creator succeeds → success bettors share the fail pool proportionally.
///   Dare creator fails    → fail bettors share the success bets proportionally.
///   In case of a tie the dare creator succeeds (creator-friendly default).

#[starknet::contract]
mod DareEscrow {
    use core::traits::Into;
    use core::option::OptionTrait;
    use starknet::{
        ContractAddress, get_caller_address, get_block_timestamp, get_contract_address,
    };
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};

    // ─── Constants ───────────────────────────────────────────────────────────

    const PLATFORM_FEE_BPS: u256 = 150_u256;   // 1.5 %
    const BPS_DENOMINATOR: u256  = 10_000_u256;
    const MIN_STAKE: u256        = 1_000_000_u256;   // 1 USDC
    const MAX_STAKE: u256        = 10_000_000_000_u256; // 10 000 USDC

    // Dare status codes (stored as u8 to save storage)
    const STATUS_OPEN:     u8 = 0;
    const STATUS_ACTIVE:   u8 = 1;
    const STATUS_PROOF:    u8 = 2;
    const STATUS_VOTING:   u8 = 3;
    const STATUS_COMPLETE: u8 = 4;
    const STATUS_FAILED:   u8 = 5;
    const STATUS_DISPUTED: u8 = 6;
    const STATUS_EXPIRED:  u8 = 7;

    // Vote options
    const VOTE_SUCCESS: u8 = 1;
    const VOTE_FAIL:    u8 = 2;

    // ─── Storage ─────────────────────────────────────────────────────────────

    #[storage]
    struct Storage {
        // Core config
        owner: ContractAddress,
        usdc_token: ContractAddress,
        treasury: ContractAddress,
        next_dare_id: u256,

        // --- Dare data ---
        dare_creator: LegacyMap<u256, ContractAddress>,
        dare_title_hash: LegacyMap<u256, felt252>,
        dare_metadata_uri: LegacyMap<u256, felt252>,
        dare_stake_amount: LegacyMap<u256, u256>,
        dare_expires_at: LegacyMap<u256, u64>,
        dare_status: LegacyMap<u256, u8>,
        dare_proof_uri: LegacyMap<u256, felt252>,
        dare_proof_hash: LegacyMap<u256, felt252>,
        dare_success_pool: LegacyMap<u256, u256>,  // stake + success bets
        dare_fail_pool: LegacyMap<u256, u256>,     // fail bets
        dare_success_votes: LegacyMap<u256, u256>,
        dare_fail_votes: LegacyMap<u256, u256>,
        dare_total_bettors: LegacyMap<u256, u256>,
        dare_rewarded: LegacyMap<u256, bool>,

        // --- Bets: (dare_id, bettor) → (amount, prediction) ---
        bet_amount: LegacyMap<(u256, ContractAddress), u256>,
        bet_prediction: LegacyMap<(u256, ContractAddress), u8>, // VOTE_SUCCESS or VOTE_FAIL

        // --- Votes: (dare_id, voter) → vote ---
        vote_cast: LegacyMap<(u256, ContractAddress), u8>,

        // --- Claimed: (dare_id, participant) → bool ---
        reward_claimed: LegacyMap<(u256, ContractAddress), bool>,
    }

    // ─── Events ──────────────────────────────────────────────────────────────

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        DareCreated: DareCreated,
        BetPlaced: BetPlaced,
        ProofSubmitted: ProofSubmitted,
        VoteCast: VoteCast,
        RewardDistributed: RewardDistributed,
        RewardClaimed: RewardClaimed,
    }

    #[derive(Drop, starknet::Event)]
    struct DareCreated {
        #[key]
        dare_id: u256,
        creator: ContractAddress,
        stake_amount: u256,
        expires_at: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct BetPlaced {
        #[key]
        dare_id: u256,
        bettor: ContractAddress,
        amount: u256,
        prediction: u8,
    }

    #[derive(Drop, starknet::Event)]
    struct ProofSubmitted {
        #[key]
        dare_id: u256,
        proof_uri: felt252,
        proof_hash: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct VoteCast {
        #[key]
        dare_id: u256,
        voter: ContractAddress,
        vote: u8,
    }

    #[derive(Drop, starknet::Event)]
    struct RewardDistributed {
        #[key]
        dare_id: u256,
        dare_succeeded: bool,
        total_pool: u256,
        platform_fee: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct RewardClaimed {
        #[key]
        dare_id: u256,
        claimer: ContractAddress,
        amount: u256,
    }

    // ─── Constructor ─────────────────────────────────────────────────────────

    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        usdc_token: ContractAddress,
        treasury: ContractAddress,
    ) {
        self.owner.write(owner);
        self.usdc_token.write(usdc_token);
        self.treasury.write(treasury);
        self.next_dare_id.write(1_u256);
    }

    // ─── External interface ───────────────────────────────────────────────────

    #[starknet::interface]
    trait IDareEscrow<TContractState> {
        fn create_dare(
            ref self: TContractState,
            title_hash: felt252,
            metadata_uri: felt252,
            stake_amount: u256,
            expires_at: u64,
        ) -> u256;

        fn join_bet(
            ref self: TContractState,
            dare_id: u256,
            prediction: u8,
            amount: u256,
        );

        fn submit_proof(
            ref self: TContractState,
            dare_id: u256,
            proof_uri: felt252,
            proof_hash: felt252,
        );

        fn vote(
            ref self: TContractState,
            dare_id: u256,
            vote: u8,
        );

        fn distribute_reward(ref self: TContractState, dare_id: u256);
        fn claim_reward(ref self: TContractState, dare_id: u256);
        fn mark_expired(ref self: TContractState, dare_id: u256);

        // Views
        fn get_dare_status(self: @TContractState, dare_id: u256) -> u8;
        fn get_bet(self: @TContractState, dare_id: u256, bettor: ContractAddress) -> (u256, u8);
        fn get_vote(self: @TContractState, dare_id: u256, voter: ContractAddress) -> u8;
        fn get_pools(self: @TContractState, dare_id: u256) -> (u256, u256);
        fn get_vote_tally(self: @TContractState, dare_id: u256) -> (u256, u256);
        fn calculate_claimable(self: @TContractState, dare_id: u256, participant: ContractAddress) -> u256;
    }

    // ─── Implementation ───────────────────────────────────────────────────────

    #[abi(embed_v0)]
    impl DareEscrowImpl of IDareEscrow<ContractState> {

        /// Create a new dare. The caller stakes USDC, which is locked in escrow.
        fn create_dare(
            ref self: ContractState,
            title_hash: felt252,
            metadata_uri: felt252,
            stake_amount: u256,
            expires_at: u64,
        ) -> u256 {
            let caller = get_caller_address();
            let now = get_block_timestamp();

            assert(stake_amount >= MIN_STAKE, 'Stake too small');
            assert(stake_amount <= MAX_STAKE, 'Stake too large');
            assert(expires_at > now + 3600_u64, 'Expiry must be > 1h from now');

            // Transfer USDC stake from creator to this contract
            let usdc = IERC20Dispatcher { contract_address: self.usdc_token.read() };
            let ok = usdc.transfer_from(caller, get_contract_address(), stake_amount);
            assert(ok, 'USDC transfer failed');

            let dare_id = self.next_dare_id.read();
            self.next_dare_id.write(dare_id + 1_u256);

            self.dare_creator.write(dare_id, caller);
            self.dare_title_hash.write(dare_id, title_hash);
            self.dare_metadata_uri.write(dare_id, metadata_uri);
            self.dare_stake_amount.write(dare_id, stake_amount);
            self.dare_expires_at.write(dare_id, expires_at);
            self.dare_status.write(dare_id, STATUS_OPEN);
            self.dare_success_pool.write(dare_id, stake_amount); // creator stake counts as "success"
            self.dare_fail_pool.write(dare_id, 0_u256);

            self.emit(DareCreated { dare_id, creator: caller, stake_amount, expires_at });

            dare_id
        }

        /// Place a bet on a dare. prediction: VOTE_SUCCESS or VOTE_FAIL.
        fn join_bet(
            ref self: ContractState,
            dare_id: u256,
            prediction: u8,
            amount: u256,
        ) {
            let caller = get_caller_address();
            let status = self.dare_status.read(dare_id);
            let now = get_block_timestamp();

            assert(status == STATUS_OPEN || status == STATUS_ACTIVE, 'Dare not open for bets');
            assert(self.dare_expires_at.read(dare_id) > now, 'Dare expired');
            assert(prediction == VOTE_SUCCESS || prediction == VOTE_FAIL, 'Invalid prediction');
            assert(amount >= MIN_STAKE, 'Bet too small');
            // One bet per address
            assert(self.bet_amount.read((dare_id, caller)) == 0_u256, 'Already bet');
            // Creator cannot bet on own dare
            assert(self.dare_creator.read(dare_id) != caller, 'Creator cannot bet');

            let usdc = IERC20Dispatcher { contract_address: self.usdc_token.read() };
            let ok = usdc.transfer_from(caller, get_contract_address(), amount);
            assert(ok, 'USDC transfer failed');

            self.bet_amount.write((dare_id, caller), amount);
            self.bet_prediction.write((dare_id, caller), prediction);
            self.dare_total_bettors.write(dare_id, self.dare_total_bettors.read(dare_id) + 1_u256);

            if prediction == VOTE_SUCCESS {
                self.dare_success_pool.write(dare_id, self.dare_success_pool.read(dare_id) + amount);
            } else {
                self.dare_fail_pool.write(dare_id, self.dare_fail_pool.read(dare_id) + amount);
            }

            if status == STATUS_OPEN {
                self.dare_status.write(dare_id, STATUS_ACTIVE);
            }

            self.emit(BetPlaced { dare_id, bettor: caller, amount, prediction });
        }

        /// Creator submits proof. Transitions dare to VOTING phase.
        fn submit_proof(
            ref self: ContractState,
            dare_id: u256,
            proof_uri: felt252,
            proof_hash: felt252,
        ) {
            let caller = get_caller_address();
            let now = get_block_timestamp();

            assert(self.dare_creator.read(dare_id) == caller, 'Only creator can submit proof');
            let status = self.dare_status.read(dare_id);
            assert(
                status == STATUS_OPEN || status == STATUS_ACTIVE,
                'Cannot submit proof in current status',
            );
            assert(self.dare_expires_at.read(dare_id) > now, 'Dare expired');

            self.dare_proof_uri.write(dare_id, proof_uri);
            self.dare_proof_hash.write(dare_id, proof_hash);
            self.dare_status.write(dare_id, STATUS_VOTING);

            self.emit(ProofSubmitted { dare_id, proof_uri, proof_hash });
        }

        /// Community member casts a vote. Can only vote once per dare.
        fn vote(ref self: ContractState, dare_id: u256, vote: u8) {
            let caller = get_caller_address();

            assert(self.dare_status.read(dare_id) == STATUS_VOTING, 'Dare not in voting');
            assert(vote == VOTE_SUCCESS || vote == VOTE_FAIL, 'Invalid vote');
            assert(self.vote_cast.read((dare_id, caller)) == 0_u8, 'Already voted');
            // Must have a stake (creator or bettor) to vote
            let is_creator = self.dare_creator.read(dare_id) == caller;
            let has_bet = self.bet_amount.read((dare_id, caller)) > 0_u256;
            assert(is_creator || has_bet, 'Must be a participant to vote');

            self.vote_cast.write((dare_id, caller), vote);

            if vote == VOTE_SUCCESS {
                self.dare_success_votes.write(dare_id, self.dare_success_votes.read(dare_id) + 1_u256);
            } else {
                self.dare_fail_votes.write(dare_id, self.dare_fail_votes.read(dare_id) + 1_u256);
            }

            self.emit(VoteCast { dare_id, voter: caller, vote });
        }

        /// Finalise the dare: deduct platform fee, mark status, emit event.
        /// Anyone can call this after voting; rewards are claimed individually.
        fn distribute_reward(ref self: ContractState, dare_id: u256) {
            assert(!self.dare_rewarded.read(dare_id), 'Already distributed');
            assert(self.dare_status.read(dare_id) == STATUS_VOTING, 'Dare not in voting');

            let success_votes = self.dare_success_votes.read(dare_id);
            let fail_votes    = self.dare_fail_votes.read(dare_id);

            // Tie → creator wins (success)
            let dare_succeeded = success_votes >= fail_votes;

            let total_pool =
                self.dare_success_pool.read(dare_id) + self.dare_fail_pool.read(dare_id);

            let platform_fee = total_pool * PLATFORM_FEE_BPS / BPS_DENOMINATOR;

            // Transfer fee to treasury
            let usdc = IERC20Dispatcher { contract_address: self.usdc_token.read() };
            let ok = usdc.transfer(self.treasury.read(), platform_fee);
            assert(ok, 'Fee transfer failed');

            // Update status
            if dare_succeeded {
                self.dare_status.write(dare_id, STATUS_COMPLETE);
            } else {
                self.dare_status.write(dare_id, STATUS_FAILED);
            }

            self.dare_rewarded.write(dare_id, true);

            self.emit(RewardDistributed { dare_id, dare_succeeded, total_pool, platform_fee });
        }

        /// Each winner pulls their share of the payout pool.
        fn claim_reward(ref self: ContractState, dare_id: u256) {
            let caller = get_caller_address();

            let status = self.dare_status.read(dare_id);
            assert(status == STATUS_COMPLETE || status == STATUS_FAILED, 'Not yet finalised');
            assert(!self.reward_claimed.read((dare_id, caller)), 'Already claimed');

            let amount = self._calculate_claimable(dare_id, caller);
            assert(amount > 0_u256, 'Nothing to claim');

            self.reward_claimed.write((dare_id, caller), true);

            let usdc = IERC20Dispatcher { contract_address: self.usdc_token.read() };
            let ok = usdc.transfer(caller, amount);
            assert(ok, 'Payout transfer failed');

            self.emit(RewardClaimed { dare_id, claimer: caller, amount });
        }

        /// Mark a dare as expired if its deadline has passed without a proof.
        /// All stakers and bettors may then claim refunds via claim_reward.
        fn mark_expired(ref self: ContractState, dare_id: u256) {
            let now = get_block_timestamp();
            let status = self.dare_status.read(dare_id);

            assert(
                status == STATUS_OPEN || status == STATUS_ACTIVE,
                'Cannot expire in current status',
            );
            assert(self.dare_expires_at.read(dare_id) <= now, 'Dare not yet expired');

            self.dare_status.write(dare_id, STATUS_EXPIRED);
            self.dare_rewarded.write(dare_id, true);
        }

        // ── Views ────────────────────────────────────────────────────────────

        fn get_dare_status(self: @ContractState, dare_id: u256) -> u8 {
            self.dare_status.read(dare_id)
        }

        fn get_bet(self: @ContractState, dare_id: u256, bettor: ContractAddress) -> (u256, u8) {
            (
                self.bet_amount.read((dare_id, bettor)),
                self.bet_prediction.read((dare_id, bettor)),
            )
        }

        fn get_vote(self: @ContractState, dare_id: u256, voter: ContractAddress) -> u8 {
            self.vote_cast.read((dare_id, voter))
        }

        fn get_pools(self: @ContractState, dare_id: u256) -> (u256, u256) {
            (
                self.dare_success_pool.read(dare_id),
                self.dare_fail_pool.read(dare_id),
            )
        }

        fn get_vote_tally(self: @ContractState, dare_id: u256) -> (u256, u256) {
            (
                self.dare_success_votes.read(dare_id),
                self.dare_fail_votes.read(dare_id),
            )
        }

        fn calculate_claimable(
            self: @ContractState,
            dare_id: u256,
            participant: ContractAddress,
        ) -> u256 {
            self._calculate_claimable(dare_id, participant)
        }
    }

    // ─── Internal helpers ─────────────────────────────────────────────────────

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        /// Compute the claimable amount for a participant after distribution.
        ///
        /// Rules:
        ///   Expired dare → full refund of stake / bet.
        ///   Dare succeeded:
        ///     Creator → receives creator_stake proportional share of net fail pool.
        ///     Success bettors → receive bet proportional share of net fail pool.
        ///     Fail bettors → nothing.
        ///   Dare failed:
        ///     Fail bettors → receive bet proportional share of net success pool.
        ///     Creator + success bettors → nothing.
        fn _calculate_claimable(
            self: @ContractState,
            dare_id: u256,
            participant: ContractAddress,
        ) -> u256 {
            if self.reward_claimed.read((dare_id, participant)) {
                return 0_u256;
            }

            let status = self.dare_status.read(dare_id);

            // Refund on expiry
            if status == STATUS_EXPIRED {
                let is_creator = self.dare_creator.read(dare_id) == participant;
                if is_creator {
                    return self.dare_stake_amount.read(dare_id);
                }
                return self.bet_amount.read((dare_id, participant));
            }

            if status != STATUS_COMPLETE && status != STATUS_FAILED {
                return 0_u256;
            }

            let dare_succeeded = status == STATUS_COMPLETE;

            let success_pool = self.dare_success_pool.read(dare_id);
            let fail_pool    = self.dare_fail_pool.read(dare_id);
            let total_pool   = success_pool + fail_pool;
            let net_pool     = total_pool - (total_pool * PLATFORM_FEE_BPS / BPS_DENOMINATOR);

            let is_creator   = self.dare_creator.read(dare_id) == participant;
            let bet_amount   = self.bet_amount.read((dare_id, participant));
            let prediction   = self.bet_prediction.read((dare_id, participant));

            if dare_succeeded {
                // Winners are creator + success bettors (success_pool denominator)
                if is_creator {
                    let creator_stake = self.dare_stake_amount.read(dare_id);
                    return net_pool * creator_stake / success_pool;
                }
                if prediction == VOTE_SUCCESS && bet_amount > 0_u256 {
                    return net_pool * bet_amount / success_pool;
                }
            } else {
                // Winners are fail bettors (fail_pool denominator)
                if prediction == VOTE_FAIL && bet_amount > 0_u256 && fail_pool > 0_u256 {
                    return net_pool * bet_amount / fail_pool;
                }
            }

            0_u256
        }
    }
}
