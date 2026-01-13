# EVM Wallet Mobile App

React Native/Expo mobile wallet application for EVM chains.

## Setup

1. **Install dependencies:**
   ```bash
   cd evm-wallet
   pnpm install
   # or
   npm install
   ```

2. **Configure environment variables:**
   
   Create a `.env` file in the `evm-wallet` directory:
   ```env
   EXPO_PUBLIC_EVM_CHAIN_ID=11155111
   EXPO_PUBLIC_EVM_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
   EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
   ```
   
   Or for production:
   ```env
   EXPO_PUBLIC_API_BASE_URL=https://your-backend-api.com
   ```

3. **Run the app:**
   ```bash
   pnpm start
   # or
   npm start
   ```

## Transaction History

The app now fetches transaction history from the backend API instead of directly calling Alchemy. This keeps API keys secure on the server.

The transaction history is displayed on the Wallet screen with:
- Direction indicators (IN/OUT/SELF)
- Asset type (Native/ERC20/ERC721/ERC1155)
- Amount and symbol
- Timestamp
- Transaction hash

Pagination is supported via "Load More" button.

## Backend Integration

Make sure your backend server is running (see `../backend/README.md`) and the `EXPO_PUBLIC_API_BASE_URL` is correctly configured.

