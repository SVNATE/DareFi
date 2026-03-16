# DareFi

**DareFi** is a decentralized dare/challenge platform built on **Starknet**. Users connect their Starknet wallets, create or join stake-based dares, submit proof-of-completion, and earn USDC rewards determined by community voting — all powered by an on-chain escrow smart contract.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Installation](#installation)
- [Running the App](#running-the-app)
- [Smart Contract](#smart-contract)
- [Screens & Navigation](#screens--navigation)
- [State Management](#state-management)
- [API Integration](#api-integration)
- [Contributing](#contributing)

---

## Features

- **Wallet Login** — Connect via Argent X, Braavos, or WalletConnect (Starknet wallets)
- **Dare Creation** — Set a challenge with a USDC stake ($1–$10,000), duration, and category
- **Betting** — Community members can bet on success or failure
- **Proof Submission** — Upload video, photo, GPS screenshot, health tracker data, or text
- **Community Voting** — 6-hour voting window; majority decides the outcome
- **On-Chain Escrow** — Funds locked in a Cairo smart contract; rewards distributed automatically
- **Leaderboard & Profiles** — Track reputation, win rate, and total winnings
- **Notifications** — Real-time updates on dare activity

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile App | React Native 0.73.6 (TypeScript) |
| State Management | Zustand |
| Navigation | React Navigation v6 (native-stack + bottom-tabs) |
| Blockchain | Starknet (Cairo smart contracts) |
| Wallet Integration | Starkzap SDK |
| Smart Contract Language | Cairo 2 (OpenZeppelin v0.9) |
| Contract Build Tool | Scarb |
| HTTP Client | Axios |
| Animations | React Native Reanimated 3 |
| Styling | react-native-linear-gradient, react-native-svg |
| Storage | AsyncStorage |
| Backend API | REST (`https://api.darefi.xyz/v1`) |

---

## Project Structure

```
DareFi/
├── App.tsx                    # Root component with navigation + toast
├── index.js                   # App entry point
├── contracts/                 # Cairo smart contracts
│   ├── Scarb.toml
│   └── src/
│       ├── lib.cairo
│       └── dare_escrow.cairo  # Main escrow contract
├── src/
│   ├── components/
│   │   ├── common/            # Reusable UI components (Button, Input, Card, etc.)
│   │   ├── dare/              # DareCard component
│   │   └── wallet/            # WalletConnectButton
│   ├── constants/
│   │   ├── colors.ts          # Global color palette
│   │   ├── config.ts          # API URLs, contract addresses, app config
│   │   └── theme.ts           # Spacing, font sizes, border radii
│   ├── navigation/
│   │   ├── AppNavigator.tsx   # Root navigator (Splash → Auth / Main)
│   │   ├── AuthNavigator.tsx  # Login → CreateUsername
│   │   └── MainNavigator.tsx  # Bottom tabs (Home, Explore, etc.)
│   ├── screens/               # All screen components
│   ├── services/
│   │   ├── api.ts             # Axios API client
│   │   ├── mockData.ts        # Development mock data
│   │   ├── starknet.ts        # Starknet.js utilities
│   │   └── starkzap.ts        # Starkzap wallet/paymaster service
│   ├── store/
│   │   ├── authStore.ts       # Auth state (wallet, session, user)
│   │   ├── daresStore.ts      # Dare listings and actions
│   │   ├── walletStore.ts     # Wallet balance and transactions
│   │   └── index.ts
│   └── types/
│       └── index.ts           # Shared TypeScript interfaces
└── android/                   # Android native project
└── ios/                       # iOS native project
```

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| React Native CLI | Latest |
| JDK | 17 (Android) |
| Android Studio | Latest (for emulator / SDK) |
| Xcode | ≥ 15 (macOS, for iOS) |
| CocoaPods | Latest (iOS) |
| Scarb | ≥ 2.6.0 (for contracts) |

---

## Environment Setup

Create a `.env` file in the project root:

```env
STARKZAP_API_KEY=your_starkzap_api_key_here
```

The app reads this via `react-native-dotenv`. All other configuration (API URL, Starknet RPC, contract addresses) lives in [`src/constants/config.ts`](src/constants/config.ts).

Key configuration values in `config.ts`:

```ts
// Backend API
export const API_BASE_URL = 'https://api.darefi.xyz/v1';

// Starknet RPC
rpcUrl: 'https://starknet-mainnet.public.blastapi.io'

// Escrow contract address (update after deploying your contract)
dareEscrow: '0x0123...abcdef'

// App limits
minStakeUSDC: 1       // $1 minimum
maxStakeUSDC: 10000   // $10,000 maximum
platformFeeBps: 150   // 1.5% fee
```

---

## Installation

```bash
# Clone the repository
git clone https://github.com/your-org/darefi.git
cd DareFi

# Install JS dependencies
npm install

# iOS only — install CocoaPods
cd ios && pod install && cd ..
```

---

## Running the App

### Start Metro bundler

```bash
npm start
```

### Android

```bash
# Debug build
npm run android:debug

# Release build
npm run android:release
```

### iOS

```bash
# Debug
npm run ios:debug

# Or simply
npm run ios
```

### Type Check & Lint

```bash
npm run type-check
npm run lint
```

---

## Smart Contract

The on-chain escrow logic lives in [`contracts/src/dare_escrow.cairo`](contracts/src/dare_escrow.cairo).

### Dare Lifecycle

```
createDare → joinBet → submitProof → vote → distributeReward
```

### Economics

- All amounts are in **USDC** (6 decimals; 1 USDC = 1,000,000)
- **Platform fee**: 1.5% (150 bps)
- **Winners**: proportional share of the losing side's pool
- **Tie-breaker**: creator-friendly (success by default)

### Dare Status Codes

| Status | Meaning |
|---|---|
| `OPEN` | Accepting bets |
| `ACTIVE` | Dare in progress |
| `PROOF` | Proof submitted, awaiting voters |
| `VOTING` | Community voting window active |
| `COMPLETE` | Creator succeeded — success bettors rewarded |
| `FAILED` | Creator failed — fail bettors rewarded |
| `DISPUTED` | Under dispute review |
| `EXPIRED` | Deadline passed with no resolution |

### Building & Deploying the Contract

```bash
cd contracts

# Build
scarb build

# Deploy (requires starkli)
starkli deploy <class_hash> <constructor_args> --network mainnet
```

---

## Screens & Navigation

```
Splash
└── Auth
    ├── Login          — Wallet selection (Argent X / Braavos / WalletConnect)
    └── CreateUsername — Username onboarding for new wallets
└── Main (Bottom Tabs)
    ├── Home           — Feed of active dares
    ├── Explore        — Browse / search dares by category
    ├── Create Dare    — Launch a new dare
    ├── Leaderboard    — Top earners and win rates
    └── Profile        — User stats, dare history
        └── DareDetails    — Full dare view
        └── VotingScreen   — Cast a vote
        └── ProofUpload    — Submit completion proof
        └── Results        — Post-dare outcome breakdown
        └── Notifications  — Activity feed
        └── UserProfile    — View another user's profile
```

---

## State Management

Zustand stores:

| Store | Responsibility |
|---|---|
| `authStore` | Wallet connection, auth token, user session, username creation |
| `daresStore` | Dare listings, creation, betting, proof submission, voting |
| `walletStore` | USDC balance, gasless transaction status |

### Auth Flow

1. User selects a wallet → `StarkzapService.connectWallet()`
2. App signs a timestamp message → `StarkzapService.signMessage()`
3. Signature sent to `POST /auth/wallet-login`
4. **New wallet** (404 response) → routed to `CreateUsername` screen
5. **Existing wallet** → session token saved, user routed to main app
6. Username creation → `POST /auth/create-user`

---

## API Integration

Base URL: `https://api.darefi.xyz/v1`

| Endpoint | Method | Purpose |
|---|---|---|
| `/auth/wallet-login` | POST | Authenticate with wallet address + signature |
| `/auth/create-user` | POST | Register a new user with username |
| `/auth/check-username/:username` | GET | Check username availability |
| `/dares` | GET | List dares (with filters) |
| `/dares` | POST | Create a new dare |
| `/dares/:id` | GET | Get dare details |
| `/dares/:id/bet` | POST | Place a bet on a dare |
| `/dares/:id/proof` | POST | Submit completion proof |
| `/dares/:id/vote` | POST | Cast a community vote |
| `/users/:id` | GET | Get user profile |
| `/leaderboard` | GET | Fetch leaderboard rankings |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push the branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please ensure `npm run type-check` and `npm run lint` pass before submitting.

---

## License

MIT © DareFi
