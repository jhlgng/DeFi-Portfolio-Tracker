# 📊 DeFi Portfolio Tracker

Welcome to DeFi Portfolio Tracker, a decentralized solution for real-time monitoring of your crypto investments! This project addresses the real-world problem of fragmented portfolio management in DeFi, where users struggle with tracking asset values, yields, and risks across multiple blockchains. By leveraging the Stacks blockchain and Clarity smart contracts, it provides transparent, immutable, and automated portfolio insights, helping investors make informed decisions without relying on centralized platforms.

## ✨ Features

📈 Real-time asset balance tracking across wallets  
💹 Automated DeFi yield calculations (e.g., APY from staking/lending)  
🚨 Custom alerts for price changes or yield thresholds  
📅 Historical performance logging for tax and analysis  
🔗 Cross-chain integration via oracles for accurate data  
🔒 Secure portfolio sharing with verifiable ownership  
📉 Risk assessment metrics (e.g., volatility scores)  
🤖 Automation hooks for rebalancing based on rules  

## 🛠 How It Works

This project is built with 8 Clarity smart contracts on the Stacks blockchain, ensuring security and decentralization. Users interact via a dApp interface that calls these contracts to manage portfolios.

**Core Smart Contracts**

1. **UserRegistry.clar**: Handles user registration, wallet linking, and profile management.  
2. **AssetTracker.clar**: Tracks token balances and updates them in real-time via oracle feeds.  
3. **YieldCalculator.clar**: Computes DeFi yields by integrating with external protocols (e.g., via read-only calls).  
4. **OracleIntegrator.clar**: Fetches and validates real-time price data from trusted oracles.  
5. **AlertSystem.clar**: Sets and triggers notifications for portfolio events (e.g., yield drops below 5%).  
6. **HistoryLogger.clar**: Stores immutable historical snapshots of portfolio states.  
7. **RiskAssessor.clar**: Calculates metrics like Sharpe ratio or drawdown using on-chain math.  
8. **PortfolioSharer.clar**: Enables encrypted sharing of portfolio views with access controls.

**For Investors (Portfolio Owners)**

- Register your wallet with UserRegistry.  
- Add assets and DeFi positions via AssetTracker.  
- Set up yield monitoring with YieldCalculator and oracles.  
- Configure alerts in AlertSystem (e.g., "notify if BTC drops 10%").  
- View historical data and risks using HistoryLogger and RiskAssessor.  

Your portfolio updates automatically on-chain— no more manual spreadsheets!

**For Verifiers or Collaborators**

- Use PortfolioSharer to request/view shared portfolios.  
- Call verify-portfolio in UserRegistry to confirm ownership.  
- Query YieldCalculator for independent yield verification.  

Instant, trustless insights for advisors or tax purposes!