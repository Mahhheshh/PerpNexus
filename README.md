> [!NOTE]
> **This was a personal learning project** - I'm no longer actively developing it.
> Feel free to explore the code, but it's incomplete and not production-ready.

# PerpNexus 🚀

A decentralized perpetual futures trading platform built on Solana, featuring leveraged trading with Pyth Network price feeds integration.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Rust and Cargo
- Solana CLI tools
- Anchor CLI

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/Mahhheshh/PerpNexus.git
cd PerpNexus
```

2. **Install dependencies**

```bash
yarn install
```

3. **Setup the Anchor program**

```bash
npm run setup
```

### Anchor/Solana Commands

```bash
# Build the Solana program
npm run anchor-build

# Start local validator with program deployed
npm run anchor-localnet

# Run program tests
npm run anchor-test

# Run tests without starting validator
npm run anchor-test-skip-val

# Generate TypeScript client
npm run codama:js
```

### Code Quality Commands

```bash
# Run linting
npm run lint

# Format code
npm run format

# Check formatting
npm run format:check

# Run all CI checks
npm run ci
```

## 🏗️ Project Structure

```
├── anchor/                     # Solana program
│   ├── programs/PerpNexus/     # Main program code
│   │   └── src/
│   │       ├── lib.rs          # Program entry point
│   │       ├── instructions/   # Program instructions
│   │       └── state/          # Program state definitions
│   ├── tests/                  # Program tests
│   └── target/                 # Build artifacts
├── src/                        # Next.js application
│   ├── app/                    # App Router pages
│   ├── components/             # Reusable UI components
│   ├── features/               # Feature-specific components
│   └── lib/                    # Utility functions
└── public/                     # Static assets
```

## 🔧 Smart Contract Architecture
### Core Instructions

1. **`init_perp_config`**: Initialize trading configuration
   - Set cranker authority
   - Configure trading fees
   - Initialize protocol parameters

2. **`open_position`**: Open a leveraged trading position
   - Specify position size and leverage
   - Choose long/short direction
   - Transfer collateral to vault

3. **`close_position`**: Close an existing position
   - Calculate P&L
   - Transfer funds back to trader
   - Update position state

### State Management

- **Config**: Global protocol configuration and fee structure
- **Position**: Individual trading position data with P&L tracking
- **Vault**: Secure collateral management and custody

> ⚠️ **Warning:**
> This project has **not been audited** and is intended for **educational and research purposes only**.
> **Do not use on Solana mainnet or with real funds.**

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
