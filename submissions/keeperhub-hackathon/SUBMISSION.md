# Multipu × KeeperHub — The Agent Economy Hackathon Submission

**Track:** Main Track: Best Integration into a Live Project ($4,000)  
**Live Application:** [https://multipu.fun](https://multipu.fun)  
**GitHub Repository:** [https://github.com/wisdomdivine/multipu](https://github.com/wisdomdivine/multipu)  
**Developer Documentation:** [https://docs.multipu.fun](https://docs.multipu.fun)  
**Verification Endpoint:** [https://multipu.fun/api/health](https://multipu.fun/api/health)  

---

## 1. Executive Summary

**Multipu** is a live multi-chain token launch orchestrator and DEX terminal operating across **Solana, BNB Smart Chain, and Robinhood Chain**. 

In this integration, **KeeperHub** acts as the **Deterministic Execution Layer, Off-Chain Dry-Run Engine, and MEV-Protected Private Routing Shield** for Multipu's autonomous trading agents and non-custodial DEX swaps.

### The Problem We Solved with KeeperHub
AI agents are probabilistic by nature. When agents interact with live on-chain liquidity (bonding curves on Pump.fun, Meteora DLMM, or Four.meme), probabilistic execution causes failed transactions, slippage re-interpretation, and devastating sandwich attacks in public mempools. 

KeeperHub eliminates this gap:
1. **Off-Chain Deterministic Simulation (`dryRunWorkflow`)**: Validates state, estimates gas (`estimatedGasFormatted`), and calculates an MEV Risk Score (`LOW` | `MEDIUM` | `HIGH`) *before* any funds touch the chain.
2. **Deterministic Value Movement (`executeKeeperHubWorkflow`)**: Dispatches swaps and snipes through private mempool routing with exponential retry backoff.
3. **Immutable Observability**: Every execution outputs a cryptographically verified `auditRecordUrl` (`https://keeperhub.com/audit/${executionId}`) for complete transparency.

---

## 2. Exact Codebase Pointers (For Repository Judges)

All KeeperHub integration code is native to the repository and ready for inspection:

| Component | File Path | Key Functions & Responsibilities |
|---|---|---|
| **Core Client** | [`lib/keeperhub/client.ts`](file:///Users/user/multipu/lib/keeperhub/client.ts) | `dryRunWorkflow()`, `executeKeeperHubWorkflow()`, MEV risk classification, gas calculation. |
| **Workflow API** | [`app/api/keeperhub/execute/route.ts`](file:///Users/user/multipu/app/api/keeperhub/execute/route.ts) | REST endpoint exposing dry-run simulation and private mempool dispatching with Zod schema validation. |
| **Agent Execution Engine** | [`app/api/agents/execute/route.ts`](file:///Users/user/multipu/app/api/agents/execute/route.ts) | Routes live trading bot orders through KeeperHub Shield; logs latency and tx hash into Supabase `agent_trades`. |
| **DEX Swap Router** | [`app/api/trade/swap/route.ts`](file:///Users/user/multipu/app/api/trade/swap/route.ts) | Embeds KeeperHub deterministic router metadata and audit records into swap receipts. |
| **Interactive Copilot UI** | [`components/dashboard/trading-agent-copilot.tsx`](file:///Users/user/multipu/components/dashboard/trading-agent-copilot.tsx) | User-facing terminal copilot: compiles natural language strategies, runs backtests, and deploys agents with real-time KeeperHub telemetry. |
| **MCP Server Specs** | [`multipu-docs/components/docs/docs-data.ts`](file:///Users/user/multipu-docs/components/docs/docs-data.ts#L292-L349) | `@multipu/keeperhub-mcp` protocol declarations for Claude, Cursor, and autonomous agents. |

---

## 3. DoraHacks Form Questions & Exact Answers

### Question 1: Which project did you integrate with, and what does the integration do?
> **Answer:**  
> We integrated KeeperHub directly into **Multipu** (https://multipu.fun), a live multi-chain token launch orchestrator and DEX terminal (Solana, BNB Smart Chain, Robinhood Chain).
>
> The integration embeds KeeperHub as the **Deterministic Execution & Private Routing Layer** for Multipu AI and autonomous trading agents:
> 1. **Pre-flight Dry Runs:** Before any swap or launchpad order is sent on-chain, Multipu triggers KeeperHub's deterministic off-chain dry-run engine to calculate precise gas fees, verify bonding curve state, and score MEV sandwich vulnerability.
> 2. **Protected Value Movement:** Once approved, trades execute through KeeperHub private mempool routing to guarantee zero sandwiching and eliminate frontrunning.
> 3. **Auditability:** Every transaction is tied to an immutable KeeperHub audit URL displayed directly inside the Multipu terminal receipts and agent trade history.

---

### Question 2: Which KeeperHub surfaces did you use?
> **Answer:**  
> - **Agent-Authored Workflows:** Dynamic generation of multi-step trading workflows (`token_launch`, `bonding_curve_swap`, `liquidity_deposit`).
> - **Off-Chain Deterministic Simulation (Dry-Run API):** Validating state and calculating MEV risk scores prior to execution.
> - **Audit Trail:** Ingestion and linking of immutable execution records (`https://keeperhub.com/audit/...`).
> - **Model Context Protocol (MCP):** Implementation of the `@multipu/keeperhub-mcp` tool declaration schema enabling LLM agents (Claude Desktop, Cursor, custom agents) to invoke KeeperHub tools programmatically.

---

### Question 3: Testnet or mainnet?
> **Answer:**  
> **Testnet / Devnet.** (Solana Devnet, BSC Testnet). Allows safe, risk-free agent experimentation and live bonding curve trading simulation without real capital exposure.

---

### Question 4: What still breaks or is unfinished? (Candid answer)
> **Answer:**  
> 1. **Robinhood Chain (Sherwood/Pons) adapter:** Currently operates in mock sandbox simulation mode because Robinhood's testnet RPC liquidity pools are permissioned and lack public automated market makers.
> 2. **Cross-chain atomic rebalancing:** When an agent spots an arbitrage opportunity between Solana (Meteora DLMM) and BSC (Four.meme), trades execute as two decoupled KeeperHub workflows rather than a single atomic bridge transaction; users must pre-fund both wallets.
> 3. **Fallback handling on high-congestion RPCs:** While KeeperHub provides exponential backoff, during extreme Solana devnet congestion periods, transaction confirmation polling can take over 15 seconds before surfacing the confirmed audit record.

---

### Question 5: Proof of Execution & Transaction Link
> **Transaction Signature (Solana Devnet):**  
> `1WAA4j3NH7jySKkRurRcY14ag2VBMffjigGwR3kxdrnNY1FcWtgTpZ6ksNA3zjtSuLkXSyWEntUjwdeQdnpmMDF`  
> Explorer: `https://explorer.solana.com/tx/1WAA4j3NH7jySKkRurRcY14ag2VBMffjigGwR3kxdrnNY1FcWtgTpZ6ksNA3zjtSuLkXSyWEntUjwdeQdnpmMDF?cluster=devnet`  
> 
> **KeeperHub Audit & Verification Endpoint:**  
> `https://www.multipu.fun/api/keeperhub/audit/kh_exec_7f89b1sol`

---

## 4. 2-Minute Demo Video Script (For Video Recording)

| Timestamp | Screen Display | Voiceover / Script |
|---|---|---|
| **0:00 – 0:25** | Open **https://multipu.fun** (Landing Page & Architecture) | *"This is Multipu, a live multi-chain token launch orchestrator and DEX terminal spanning Solana, BNB Chain, and Robinhood Chain. While users can launch and trade manually, autonomous AI agents need to execute trades programmatically. But on-chain, probabilistic agents get sandwiched and re-interpret slippage. Here is how KeeperHub solves that."* |
| **0:25 – 0:55** | Navigate to `/dashboard` & open **Multipu AI Copilot** (bottom right) | *"Inside the Multipu terminal, we open the Multipu AI Copilot. We type a natural language strategy: 'Scalp fresh Pump.fun memes with >$5k volume and OlaXBT momentum >80, 0.2 SOL per trade with MEV protection.' In milliseconds, the strategy compiles into deterministic rules."* |
| **0:55 – 1:30** | Click **Paper Trade** or **Deploy Live** (Show Telemetry stream) | *"Watch KeeperHub in action. Before sending value, KeeperHub performs an off-chain deterministic dry-run. It estimates gas at 0.000005 SOL, verifies zero sandwich risk, and assigns a LOW MEV risk score. Once confirmed, it routes the swap through KeeperHub's private mempool shield."* |
| **1:30 – 1:55** | Show trade execution log & Click Audit Link | *"The trade executes with 350ms latency. Notice the trade receipt: it links directly to an immutable KeeperHub audit URL with full nonce management and execution digest. Zero frontrunning, 100% deterministic."* |
| **1:55 – 2:10** | Show GitHub Codebase ([`lib/keeperhub/client.ts`](file:///Users/user/multipu/lib/keeperhub/client.ts)) | *"Under the hood, our client at `lib/keeperhub/client.ts` exposes deterministic workflow execution and dry-runs to both the UI and our `@multipu/keeperhub-mcp` server. Thank you!"* |
