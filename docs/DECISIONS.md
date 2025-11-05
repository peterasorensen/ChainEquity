# ChainEquity Decision Log

A chronological record of major architectural and technical decisions made during the development of ChainEquity.

## Decision Format

For each decision:
- **Date**: When decision was made
- **Context**: Problem we were trying to solve
- **Options**: Alternatives we considered
- **Decision**: What we chose
- **Rationale**: Why we made this choice
- **Trade-offs**: Pros and cons of our approach
- **Status**: Current status (Active, Superseded, Deprecated)

---

## 1. Blockchain Selection

**Date**: Project Kickoff

**Context**: Need to choose a blockchain platform for deploying the tokenized security prototype. Requirements include low gas costs for frequent operations, EVM compatibility for using standard tools, and testnet availability for risk-free development.

**Options Considered**:

1. **Ethereum Sepolia Testnet**
   - Pros: Most decentralized, largest ecosystem, maximum compatibility
   - Cons: High gas costs (~$5-50 per transaction), slower block times (12s)

2. **Polygon Amoy Testnet**
   - Pros: 100x cheaper gas, fast finality (2s blocks), EVM compatible, mature testnet
   - Cons: Less decentralized than Ethereum, smaller ecosystem

3. **Arbitrum Sepolia**
   - Pros: Layer 2 cost savings, EVM compatible, growing ecosystem
   - Cons: More complex infrastructure, less familiar to developers

4. **Solana Devnet**
   - Pros: Extremely fast (400ms blocks), very cheap, high throughput
   - Cons: Different programming model (Rust), not EVM, steeper learning curve

5. **Local Anvil/Ganache**
   - Pros: Free, instant, complete control
   - Cons: Not demonstrable publicly, unrealistic conditions

**Decision**: Polygon Amoy Testnet

**Rationale**:
- Gas efficiency critical for corporate actions (splits) and frequent admin operations
- 2-second block times enable fast demo cycles and better UX
- Full EVM compatibility means we can use Solidity, Foundry, and standard libraries
- Easy migration path to Polygon PoS mainnet if needed
- Well-supported testnet with reliable faucets

**Trade-offs**:
- Pros: Optimal cost/speed balance, EVM compatible, production-ready testnet
- Cons: Less decentralized than Ethereum mainnet, smaller validator set

**Status**: Active

---

## 2. Smart Contract Framework

**Date**: Project Kickoff

**Context**: Need to choose between Hardhat and Foundry for smart contract development, testing, and deployment.

**Options Considered**:

1. **Hardhat**
   - Pros: Most popular, extensive plugin ecosystem, JavaScript tests, familiar to many
   - Cons: Slower test execution, requires JS/TS for tests, more configuration

2. **Foundry**
   - Pros: 10-100x faster tests, built-in gas profiling, Solidity tests, fuzzing support
   - Cons: Newer, smaller ecosystem, less familiar to some developers

**Decision**: Foundry

**Rationale**:
- Test execution speed critical for TDD workflow (milliseconds vs seconds)
- Built-in gas reporting essential for meeting gas benchmarks
- Fuzzing capabilities help find edge cases automatically
- Writing tests in Solidity reduces context switching
- Better developer experience with watch mode and fast feedback

**Trade-offs**:
- Pros: Blazing fast tests, better DX, built-in gas reports, simpler setup
- Cons: Smaller community, fewer plugins, less familiar to some

**Status**: Active

---

## 3. Stock Split Implementation

**Date**: Early Development

**Context**: Need to implement 7-for-1 stock split that multiplies all holder balances. Iterating through all holders on-chain is prohibitively expensive (50k gas per holder = 5M gas for 100 holders).

**Options Considered**:

1. **Iterate and Update All Balances**
   ```solidity
   for (uint i = 0; i < holders.length; i++) {
       _balances[holders[i]] *= 7;
   }
   ```
   - Pros: Simple, explicit, everyone understands
   - Cons: Gas cost scales linearly, 1000+ holders exceeds block limit, not scalable

2. **Deploy New Contract and Migrate**
   ```solidity
   // Deploy new contract with 7x supply
   // Each holder claims new tokens
   ```
   - Pros: Clean slate, explicit migration history
   - Cons: Complex process, requires all holders to claim, breaks contract address, risky

3. **Stored Multiplier (Virtual Split)**
   ```solidity
   uint256 public splitMultiplier = 1;
   function balanceOf(address a) returns (uint256) {
       return _balances[a] * splitMultiplier;
   }
   ```
   - Pros: O(1) gas cost, instant, works for any holder count
   - Cons: Requires display logic awareness, unconventional ERC-20 implementation

4. **Proxy Pattern with Batch Migration**
   ```solidity
   // Upgradeable proxy with batched balance updates
   ```
   - Pros: Maintains contract address
   - Cons: Still requires expensive iteration, adds complexity

**Decision**: Stored Multiplier (Virtual Split)

**Rationale**:
- Only approach that scales to arbitrary holder counts
- Fixed ~30k gas cost regardless of 10 or 10,000 holders
- Instant execution, no batching or waiting
- Atomic operation, no partial states
- Simple implementation, minimal code

**Trade-offs**:
- Pros: O(1) gas, instant, scalable, cheap, simple
- Cons: UI/indexer must apply multiplier, unconventional but valid ERC-20

**Status**: Active

---

## 4. Symbol Change Implementation

**Date**: Early Development

**Context**: Companies need to change ticker symbols for rebranding or acquisitions. Must update symbol while preserving all balances and contract state.

**Options Considered**:

1. **Mutable Storage Variable**
   ```solidity
   string public symbol;
   function changeSymbol(string memory newSymbol) { symbol = newSymbol; }
   ```
   - Pros: Simple, low gas (~30k), instant, preserves state
   - Cons: Requires mutable metadata, wallets may cache old symbol

2. **Deploy New Contract**
   ```solidity
   // Deploy new GatedToken with new symbol
   // Migrate balances and allowlist
   ```
   - Pros: Clean separation, preserves old contract
   - Cons: Breaks contract address, complex migration, loses history

3. **Proxy Wrapper**
   ```solidity
   // Wrapper returns new symbol, proxies other calls
   ```
   - Pros: Preserves original contract
   - Cons: New address, adds indirection, complicates integrations

4. **Off-Chain Metadata**
   ```solidity
   // Symbol immutable, display name in external JSON
   ```
   - Pros: Flexible, no on-chain changes
   - Cons: Not standard for ERC-20, requires metadata server

**Decision**: Mutable Storage Variable

**Rationale**:
- Simplest implementation with lowest gas cost
- Instant update, single transaction
- Preserves contract address and all state
- ERC-20 standard doesn't mandate immutability
- Event emission ensures transparency

**Trade-offs**:
- Pros: Simple, cheap, instant, preserves state
- Cons: Unconventional, wallets may lag, requires indexer awareness

**Status**: Active

---

## 5. Backend Language and Framework

**Date**: Project Kickoff

**Context**: Need to build backend API for admin operations, event indexing, and cap-table generation.

**Options Considered**:

1. **Node.js + Express**
   - Pros: JavaScript ecosystem, fast development, excellent web3 libraries
   - Cons: Single-threaded, callback complexity

2. **Python + Flask/FastAPI**
   - Pros: Simple syntax, good web3.py library, familiar to many
   - Cons: Slower than Node.js, less async support

3. **Rust + Actix**
   - Pros: Maximum performance, memory safety, strong typing
   - Cons: Steeper learning curve, slower development

**Decision**: Node.js + Express

**Rationale**:
- Best web3 library ecosystem (ethers, viem, web3.js)
- Fast development velocity for prototype
- Excellent TypeScript support
- Good async support for WebSocket event listening
- Familiar to most developers

**Trade-offs**:
- Pros: Fast development, great libraries, good performance
- Cons: Single-threaded limitations for heavy compute

**Status**: Active

---

## 6. Web3 Library Selection

**Date**: Early Development

**Context**: Need to choose between Ethers.js and Viem for blockchain interactions in the backend.

**Options Considered**:

1. **Ethers.js v6**
   - Pros: Most mature, battle-tested, largest community, extensive documentation
   - Cons: Larger bundle (~100kb), older API patterns, less TypeScript-friendly

2. **Viem**
   - Pros: Modern TypeScript, smaller bundle (~50kb), better type inference, tree-shakeable
   - Cons: Newer, smaller community, less documentation

3. **Web3.js**
   - Pros: Original library, comprehensive
   - Cons: Dated API, poor TypeScript support, larger bundle

**Decision**: Viem

**Rationale**:
- First-class TypeScript support with excellent type inference
- Modern API design more intuitive than ethers
- Smaller bundle size matters for serverless deployment
- Tree-shakeable modules improve performance
- Active development with future-proof patterns
- Better support for modern features (account abstraction, EIP-712)

**Trade-offs**:
- Pros: Better TypeScript, smaller bundle, modern API, faster
- Cons: Smaller community, less documentation, newer (less battle-tested)

**Status**: Active

---

## 7. Relayer Pattern Implementation

**Date**: Mid Development

**Context**: Users need MATIC for gas fees, creating onboarding friction. Want to provide gasless transaction UX.

**Options Considered**:

1. **No Relayer (Users Pay Gas)**
   - Pros: Simple, no additional infrastructure
   - Cons: Poor UX, requires users to get MATIC, adds friction

2. **Centralized Relayer Service**
   - Pros: Good UX, operator controls gas, can enforce additional checks
   - Cons: Centralization risk, need to fund relayer wallet

3. **OpenZeppelin Defender**
   - Pros: Professional service, secure, monitoring included
   - Cons: SaaS dependency, cost, overkill for prototype

4. **EIP-2771 Meta-Transactions**
   - Pros: Standardized, decentralized relayer network possible
   - Cons: More complex implementation, requires contract changes

**Decision**: Centralized Relayer Service (In-House)

**Rationale**:
- Dramatically improves UX (no gas token required)
- Simplifies onboarding for demos
- Operator controls gas strategy and pricing
- Can enforce additional compliance checks before relay
- Simple implementation for prototype
- Full control over relayer logic

**Trade-offs**:
- Pros: Best UX, simple, full control, low cost
- Cons: Centralized (single point of failure), requires funded wallet, manual management

**Status**: Active

---

## 8. Event Indexer Architecture

**Date**: Early Development

**Context**: Need to generate cap-tables from on-chain events. Must maintain accurate ownership records and support historical queries.

**Options Considered**:

1. **The Graph Protocol**
   - Pros: Decentralized, powerful querying, subgraph ecosystem
   - Cons: Deployment complexity, GraphQL learning curve, overkill for prototype

2. **Moralis**
   - Pros: Easy setup, managed service, good documentation
   - Cons: SaaS vendor lock-in, API limits, monthly cost

3. **Alchemy/Infura APIs**
   - Pros: Professional service, reliable
   - Cons: API rate limits, cost, less control over data model

4. **Custom Indexer (WebSocket + SQLite)**
   - Pros: Complete control, no dependencies, simple, free
   - Cons: DIY maintenance, no redundancy, manual scaling

**Decision**: Custom Indexer (WebSocket + SQLite)

**Rationale**:
- Full control over data model and queries
- Direct WebSocket connection provides real-time updates
- SQLite sufficient for prototype scale
- No external dependencies or API limits
- Simple SQL queries for cap-table generation
- Zero cost, no rate limits
- Easy to understand and modify

**Trade-offs**:
- Pros: Full control, simple, free, real-time, no limits
- Cons: DIY maintenance, single point of failure, manual scaling

**Status**: Active

---

## 9. Database Selection

**Date**: Early Development

**Context**: Need database for storing indexed events and cap-table data. Requirements include ACID transactions, SQL queries, and simplicity.

**Options Considered**:

1. **SQLite**
   - Pros: Zero config, file-based, ACID compliant, fast for reads, portable
   - Cons: Limited concurrency, not ideal for massive scale

2. **PostgreSQL**
   - Pros: Better concurrency, more features, industry standard, proven at scale
   - Cons: Requires server, more complex setup, overkill for prototype

3. **MongoDB**
   - Pros: Flexible schema, JSON-native, good for event logs
   - Cons: No ACID before v4, less suited for financial data, overkill

4. **In-Memory (No Persistence)**
   - Pros: Fastest, simplest
   - Cons: Data loss on restart, not suitable for production

**Decision**: SQLite

**Rationale**:
- Zero configuration, single file database
- Sufficient performance for thousands of holders
- ACID compliance ensures cap-table accuracy
- SQL queries natural for financial data
- Simple backup (copy file)
- No server required
- Easy upgrade path to PostgreSQL if needed

**Trade-offs**:
- Pros: Simple, fast, ACID, portable, zero config
- Cons: Limited concurrency, not for massive scale

**Status**: Active

---

## 10. Frontend Framework Selection

**Date**: Project Kickoff

**Context**: Need to build operator UI for demonstrations. Requirements include fast development, TypeScript support, and modern React patterns.

**Options Considered**:

1. **Next.js 13+ (App Router)**
   - Pros: Server components, file-based routing, TypeScript, modern
   - Cons: Learning curve for new patterns

2. **Create React App**
   - Pros: Simple, well-known, minimal configuration
   - Cons: Deprecated, no SSR, slower builds

3. **Vite + React**
   - Pros: Fast builds, simple, modern
   - Cons: Manual routing, no SSR out of box

4. **Plain HTML + JavaScript**
   - Pros: No dependencies, simple
   - Cons: Poor DX, manual state management

**Decision**: Next.js 13+ (App Router)

**Rationale**:
- Server components improve performance
- File-based routing reduces boilerplate
- Excellent TypeScript integration
- Can colocate API routes if needed
- Modern React patterns (RSC, Suspense)
- Good developer experience
- Industry standard for new projects

**Trade-offs**:
- Pros: Modern, fast, great DX, TypeScript, SSR
- Cons: Learning curve for app router

**Status**: Active

---

## 11. CSS Approach

**Date**: Early Development

**Context**: Need to style the frontend UI. Want to demonstrate pure CSS skills without relying on utility frameworks.

**Options Considered**:

1. **Tailwind CSS**
   - Pros: Fast development, utility-first, popular
   - Cons: Large bundle, build dependency, vendor lock-in

2. **CSS Modules**
   - Pros: Scoped styles, no runtime, full CSS control, smaller bundle
   - Cons: More verbose than Tailwind

3. **Styled Components**
   - Pros: CSS-in-JS, dynamic styling
   - Cons: Runtime overhead, larger bundle

4. **Plain CSS**
   - Pros: No dependencies, simple
   - Cons: No scoping, naming conflicts

**Decision**: CSS Modules

**Rationale**:
- Demonstrates pure CSS skills
- Scoped styles prevent conflicts
- No build-time framework dependency
- Smaller bundle than Tailwind
- Full control over styling
- Native Next.js support
- Shows fundamental understanding vs framework reliance

**Trade-offs**:
- Pros: Full control, no dependencies, smaller bundle, scoped
- Cons: More verbose, slower than Tailwind for rapid prototyping

**Status**: Active

---

## 12. Monorepo Structure

**Date**: Project Setup

**Context**: Project has multiple packages (backend, frontend, shared, contracts). Need to decide on repository structure.

**Options Considered**:

1. **NPM Workspaces**
   - Pros: Native to npm, simple setup, good for smaller projects
   - Cons: Limited features compared to alternatives

2. **Yarn Workspaces**
   - Pros: Good monorepo support, faster than npm
   - Cons: Another package manager to manage

3. **Turborepo**
   - Pros: Caching, parallel builds, optimized for monorepos
   - Cons: Additional dependency, learning curve

4. **Separate Repositories**
   - Pros: Independent versioning, clear boundaries
   - Cons: Harder to share code, coordinate changes

**Decision**: NPM Workspaces

**Rationale**:
- Native npm support, no additional tools
- Simple setup for prototype scale
- Shared dependencies across packages
- Single `npm install` at root
- Easy to share TypeScript types
- Sufficient for project size

**Trade-offs**:
- Pros: Simple, native, no extra deps, good enough
- Cons: Less optimized than Turborepo for large scale

**Status**: Active

---

## 13. Admin Access Control

**Date**: Early Development

**Context**: Need access control for admin operations (minting, approvals, corporate actions).

**Options Considered**:

1. **Single Owner (Ownable)**
   ```solidity
   address public owner;
   modifier onlyOwner() { require(msg.sender == owner); _; }
   ```
   - Pros: Simple, low gas, easy to understand
   - Cons: Single point of failure, no redundancy

2. **Multi-Sig (Gnosis Safe)**
   - Pros: No single point of failure, industry standard
   - Cons: Complex integration, slower operations, overkill for prototype

3. **Role-Based Access Control (RBAC)**
   ```solidity
   mapping(address => Role) public roles;
   ```
   - Pros: Flexible permissions
   - Cons: More complex, higher gas, overkill for prototype

4. **Ownable2Step (Transfer Ownership Safely)**
   - Pros: Safer ownership transfer than Ownable
   - Cons: Still single owner

**Decision**: Single Owner (Ownable)

**Rationale**:
- Sufficient for prototype and demonstration
- Lowest gas cost
- Simplest implementation
- Easy to understand and audit
- Clear responsibility
- Can upgrade to multi-sig in production

**Trade-offs**:
- Pros: Simple, cheap, clear, sufficient for demo
- Cons: Single point of failure, not production-ready

**Future**: Upgrade to Gnosis Safe multi-sig for production

**Status**: Active (with documented production upgrade path)

---

## 14. Testing Strategy

**Date**: Early Development

**Context**: Need comprehensive testing for smart contracts, backend, and integration flows.

**Options Considered**:

1. **Unit Tests Only**
   - Pros: Fast, isolated
   - Cons: Doesn't test real interactions

2. **Integration Tests Only**
   - Pros: Tests real flows
   - Cons: Slow, brittle, hard to debug

3. **Hybrid (Unit + Integration)**
   - Pros: Balance of speed and coverage
   - Cons: More tests to maintain

**Decision**: Hybrid Approach

**Rationale**:
- Unit tests for contract logic (Foundry)
- Integration tests for API flows (Jest/Supertest)
- E2E tests for critical user flows
- Fuzzing for edge cases (Foundry)
- Gas benchmarks (Foundry)

**Test Coverage Requirements**:
- Smart contracts: >95% line coverage
- Backend: >80% line coverage
- All PRD scenarios covered

**Trade-offs**:
- Pros: Comprehensive, fast feedback, catches bugs early
- Cons: More tests to write and maintain

**Status**: Active

---

## 15. Deployment Strategy

**Date**: Mid Development

**Context**: Need reproducible deployment process for contracts and services.

**Options Considered**:

1. **Manual Deployment**
   - Pros: Simple, full control
   - Cons: Error-prone, not reproducible

2. **Forge Scripts**
   ```solidity
   forge script script/Deploy.s.sol --broadcast
   ```
   - Pros: Reproducible, version controlled, Solidity-native
   - Cons: Learning curve

3. **Hardhat Deploy Plugin**
   - Pros: Feature-rich, migration support
   - Cons: Requires Hardhat, complex configuration

**Decision**: Forge Scripts

**Rationale**:
- Reproducible deployments via script
- Version controlled deployment logic
- Same language as contracts (Solidity)
- Built-in Foundry support
- Simple configuration via environment variables
- Transaction replay for debugging

**Trade-offs**:
- Pros: Reproducible, simple, version controlled
- Cons: Less features than Hardhat Deploy

**Status**: Active

---

## Summary of Key Decisions

| Area | Decision | Primary Rationale |
|------|----------|-------------------|
| **Blockchain** | Polygon Amoy | Cost efficiency + EVM compatibility |
| **Contract Framework** | Foundry | Test performance + gas profiling |
| **Stock Split** | Stored multiplier | O(1) gas cost at any scale |
| **Symbol Change** | Mutable storage | Simple + low gas + preserves state |
| **Backend Language** | Node.js + Express | Best web3 libraries + fast dev |
| **Web3 Library** | Viem | Modern TypeScript + performance |
| **Relayer** | In-house service | Best UX + full control |
| **Event Indexer** | Custom (WebSocket) | Full control + no dependencies |
| **Database** | SQLite | Simple + sufficient + portable |
| **Frontend** | Next.js 13+ | Modern React + TypeScript |
| **Styling** | CSS Modules | No framework + scoped + control |
| **Monorepo** | NPM Workspaces | Native + simple + sufficient |
| **Access Control** | Single owner | Simple for prototype |
| **Testing** | Hybrid (unit + integration) | Speed + coverage balance |
| **Deployment** | Forge scripts | Reproducible + version controlled |

---

## Decision Review Process

Decisions should be reviewed:
- Before production deployment
- When scaling requirements change
- When new technologies emerge
- After incidents or issues

**Production Upgrades Planned**:
- Admin: Single owner → Gnosis Safe multi-sig
- Database: SQLite → PostgreSQL with replication
- Indexer: Single instance → Redundant with queue
- Deployment: Manual → CI/CD with staging environment

---

**Last Updated**: 2025-11-04
