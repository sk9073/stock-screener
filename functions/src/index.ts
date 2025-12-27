import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import { defineSecret } from "firebase-functions/params";
import sgMail = require("@sendgrid/mail");
import { findFallingStocks, StockDropResult } from "./scanner";

const sendGridApiKey = defineSecret("SENDGRID_API_KEY");

export const dailyStockScan = onSchedule(
  {
    schedule: "every day 08:00",
    timeZone: "Asia/Kolkata",
    secrets: [sendGridApiKey],
    timeoutSeconds: 540, // 9 minutes
    memory: "1GiB",
  },
  async (event) => {
    logger.info("Starting daily stock scan...");
    
    try {
        const stocks = await findFallingStocks();
        
        if (stocks.length === 0) {
            logger.info("No stocks found matching criteria.");
            return;
        }

        logger.info(`Found ${stocks.length} stocks. Sending email...`);
        
        sgMail.setApiKey(sendGridApiKey.value());

        const msg = {
          to: "sivanandi9073@gmail.com",
          from: "smurugesapillai@perchenergy.com",
          subject: `Stock Alert: ${stocks.length} Stocks Fell >6%`,
          html: generateHtmlTable(stocks),
        };

        await sgMail.send(msg);
        logger.info("Email sent successfully.");

    } catch (error) {
        logger.error("Error in dailyStockScan:", error);
    }
  }
);

function generateHtmlTable(stocks: StockDropResult[]): string {
    const rows = stocks.map(s => `
        <tr>
            <td>${s.symbol}</td>
            <td>${s.currentPrice.toFixed(2)}</td>
            <td>${s.referencePrice.toFixed(2)}</td>
            <td style="color: red;">${s.dropPercentage}%</td>
            <td>${s.referenceDate}</td>
        </tr>
    `).join('');

    return `
        <h2>Daily Stock Drop Alert (>6% in 6 days)</h2>
        <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
            <thead>
                <tr style="background-color: #f2f2f2;">
                    <th>Symbol</th>
                    <th>Current Price</th>
                    <th>Ref Price (6d ago)</th>
                    <th>Drop %</th>
                    <th>Ref Date</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
}
