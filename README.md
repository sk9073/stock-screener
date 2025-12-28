# Intelligent NSE Stock Screener + AI Analyst

An automated stock screening system that runs daily on the cloud. It scans 500+ NSE stocks for technical setups, scrapes relevant financial news, and uses **Gemini 2.0 Flash AI** to generate a professional trading plan.

## ✨ Features
1.  **Technical Scanners**:
    *   📉 **Falling Knife**: Stocks down >6% in a week (Potential bounces).
    *   ⚡ **RSI Reversion**: High-quality oversold stocks in an uptrend.
    *   🌟 **Golden Cross**: Bullish trend reversal (50 SMA crosses above 200 SMA).
2.  **Deep News Scraping**:
    *   Automatically finds the top recent news for shortlisted stocks.
    *   Reads the *full article content* (not just headlines) to understand sentiment.
3.  **AI Hedge Fund Analyst**:
    *   Powered by Google's **Gemini 2.0 Flash**.
    *   Analyzes the confluence of Technicals + Fundamentals + News.
    *   Outputs a clear **Action Plan** (Buy Price, Stop Loss, Target).
4.  **Email Alerts**:
    *   Sends a comprehensive HTML report to your inbox every morning at 8:00 AM IST.

## 🚀 Architecture
*   **Backend**: Firebase Cloud Functions (Node.js).
*   **Scheduling**: Google Cloud Scheduler (runs Mon-Fri at 8:00 AM IST).
*   **Data Sources**: 
    *   `yahoo-finance2` (Price Data).
    *   `google-news-rss` + `cheerio` (News & Article Scraping).
*   **AI Engine**: Gemini 2.0 Flash (via direct REST API).
*   **Notifications**: SendGrid Email API.

## 🛠️ Setup & Deployment

1.  **Dependencies**:
    ```bash
    cd functions
    npm install
    ```

2.  **Environment Secrets**:
    This project uses Google Cloud Secret Manager for security.
    *   `SENDGRID_API_KEY`: For sending emails.
    *   `GEMINI_API_KEY`: For AI analysis.

3.  **Local Testing**:
    ```bash
    cd functions
    npm run shell
    # Inside the shell:
    dailyStockScan()
    ```

4.  **Deployment**:
    ```bash
    cd functions
    firebase deploy --only functions
    ```

## 📈 Trading Guide
We have implemented multiple scanning strategies.
👉 **[Read the Full Trading Guide](TRADING_GUIDE.md)** to understand how to interpret the AI's signals.

Note: This tool is for informational purposes only. Trading stocks involves risk.

