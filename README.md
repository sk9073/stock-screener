# NSE 500 Stock Drop Scanner

This tool scans a list of NSE 500 stocks to identify those that have fallen by **-6% or more** over the last 6 days.

## Why Yahoo Finance?
We used **`yahoo-finance2`** instead of Alpha Vantage because:
1.  **Alpha Vantage Limit**: The free tier restricts you to **25 requests per day**. Scanning 500 stocks would take 20 days.
2.  **Efficiency**: Yahoo Finance allows fetching multiple days of history efficiently without strict daily quotas (though general rate limits apply, which our script handles).

## Strategy & Trading Guide
We have implemented multiple scanning strategies including RSI Reversion and Golden Cross.
👉 **[Read the Full Trading Guide](TRADING_GUIDE.md)** to understand how to interpret these signals.

## Setup

1.  **Install Dependencies** (if you haven't already):
    ```bash
    npm install
    ```

2.  **Define Your Stocks**:
    - Edit `src/tickers.ts`.
    - You can download the full NIFTY 500 list from the [NSE Website](https://www.nseindia.com/products-services/indices-nifty500-index).
    - Ensure symbols have the `.NS` suffix (e.g., `RELIANCE.NS`).

## Running the Scanner

Run the script using `ts-node`:

```bash
npx ts-node src/scanner.ts
```

## Scheduling (Mac/Linux)

To run this daily at 8 AM, you can add a generic cron job:

```bash

## Deployment to Firebase Functions

This project includes a Firebase Function to run the scanner daily at 8 AM IST and email the results.

### Prerequisites
1.  Firebase project initialized.
2.  SendGrid API Key (stored in Google Cloud Secret Manager as `SENDGRID_API_KEY`).
3.  Sender email authenticated in SendGrid.

### Deploying

```bash
cd functions
npm install
npm run deploy
```

The function `dailyStockScan` will be deployed.

