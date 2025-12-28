import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import { defineSecret } from "firebase-functions/params";
import sgMail = require("@sendgrid/mail");
import { findFallingStocks, StockDropResult } from "./scanner";
import { scanRsiStrategy, scanGoldenCrossStrategy, RsiResult, GoldenCrossResult } from "./strategies";
import { fetchStockNews, StockNews } from "./news";
import { getAiAnalysis } from "./ai_analyst";

const sendGridApiKey = defineSecret("SENDGRID_API_KEY");
const geminiApiKey = defineSecret("GEMINI_API_KEY");

export const dailyStockScan = onSchedule(
  {
    schedule: "every monday,tuesday,wednesday,thursday,friday 08:00",
    timeZone: "Asia/Kolkata",
    secrets: [sendGridApiKey, geminiApiKey],
    timeoutSeconds: 540, // 9 minutes
    memory: "1GiB",
  },
  async (event) => {
    logger.info("Starting daily stock scan...");
    
    try {
        // 1. Run Technical Scanners
        const [fallingStocks, rsiStocks, goldenCrossStocks] = await Promise.all([
          findFallingStocks(),
          scanRsiStrategy(),
          scanGoldenCrossStrategy()
        ]);

        const totalAlerts = fallingStocks.length + rsiStocks.length + goldenCrossStocks.length;
        
        if (totalAlerts === 0) {
            logger.info("No stocks found matching any criteria.");
            return;
        }

        // 2. Gather Unique Symbols of Interest
        // Prioritize Golden Cross and High-Quality RSI
        const interestedSymbols = new Set<string>();
        goldenCrossStocks.forEach(s => interestedSymbols.add(s.symbol));
        rsiStocks.filter(s => s.trend === 'OVERSOLD_IN_UPTREND').forEach(s => interestedSymbols.add(s.symbol));
        fallingStocks.forEach(s => interestedSymbols.add(s.symbol));
        
        // 3. Fetch News (Limit to top 10 to avoid API rate limits/timeouts)
        logger.info(`Fetching news for ${interestedSymbols.size} symbols...`);
        const newsMap: Record<string, StockNews[]> = {};
        const symbolsArray = Array.from(interestedSymbols).slice(0, 10);
        
        for (const sym of symbolsArray) {
            newsMap[sym] = await fetchStockNews(sym);
            // Small delay
            await new Promise(r => setTimeout(r, 100));
        }

        // 4. Get AI Analysis
        logger.info("Requesting AI Analysis...");
        const aiAssessment = await getAiAnalysis(
            geminiApiKey.value(), 
            fallingStocks, 
            rsiStocks, 
            goldenCrossStocks, 
            newsMap
        );

        logger.info(`Found ${totalAlerts} total alerts. Sending email...`);
        
        sgMail.setApiKey(sendGridApiKey.value());

        const msg = {
          to: "sivanandi9073@gmail.com",
          from: "smurugesapillai@perchenergy.com",
          subject: `Stock Alert: ${totalAlerts} Opportunities Found (+ AI Analysis)`,
          html: generateComprehensiveEmail(fallingStocks, rsiStocks, goldenCrossStocks, newsMap, aiAssessment),
        };

        await sgMail.send(msg);
        logger.info("Email sent successfully.");

    } catch (error) {
        logger.error("Error in dailyStockScan:", error);
    }
  }
);

function generateComprehensiveEmail(
    falling: StockDropResult[], 
    rsi: RsiResult[], 
    gc: GoldenCrossResult[],
    newsMap: Record<string, StockNews[]>,
    aiAnalysis: string
): string {
    
    const fallingTable = falling.length ? generateFallingTable(falling) : '<p>No stocks falling >6% detected.</p>';
    const rsiTable = rsi.length ? generateRsiTable(rsi) : '<p>No RSI opportunities detected.</p>';
    const gcTable = gc.length ? generateGcTable(gc) : '<p>No Golden Crosses detected today.</p>';
    
    // Generate News Section
    let newsHtml = '';
    for (const [sym, items] of Object.entries(newsMap)) {
        if (items.length > 0) {
            newsHtml += `<h4>${sym}</h4><ul>`;
            items.forEach(n => {
                newsHtml += `<li><a href="${n.link}">${n.title}</a> <span style="font-size:10px; color:#666;">(${n.publisher})</span></li>`;
            });
            newsHtml += `</ul>`;
        }
    }
    if (!newsHtml) newsHtml = '<p>No major news found for top picks.</p>';

    return `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h1 style="color: #2c3e50;">Daily Market Scanner Results</h1>
            <p>Automated Technical + AI Analysis Report</p>
            <hr />
            
            <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; border: 1px solid #bda0e3;">
                <h2 style="margin-top: 0; color: #4b0082;">🤖 AI Analyst's Pick of the Day</h2>
                ${aiAnalysis}
            </div>
            <br />

            <h2 style="color: #c0392b;">1. Falling Knives (>6% Drop)</h2>
            ${fallingTable}
            
            <br />
            <h2 style="color: #2980b9;">2. RSI Reversion Candidates</h2>
            ${rsiTable}
            
            <br />
            <h2 style="color: #f39c12;">3. Golden Cross (Trend Reversal)</h2>
            ${gcTable}
            
            <br />
            <h2 style="color: #333;">📰 Recent News (Top Picks)</h2>
            ${newsHtml}
            
            <br />
            <p style="font-size: 12px; color: #777;">Generated by Firebase Cloud Functions + Gemini AI.</p>
        </div>
    `;
}

function generateFallingTable(stocks: StockDropResult[]): string {
    const rows = stocks.map(s => `
        <tr>
            <td><b>${s.symbol}</b></td>
            <td>${s.currentPrice.toFixed(2)}</td>
            <td>${s.referencePrice.toFixed(2)}</td>
            <td style="color: red; font-weight: bold;">${s.dropPercentage}%</td>
            <td>${s.referenceDate}</td>
        </tr>
    `).join('');

    return `
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; border-color: #ddd;">
            <thead>
                <tr style="background-color: #f2f2f2;">
                    <th>Symbol</th>
                    <th>Price</th>
                    <th>Ref Price</th>
                    <th>Drop %</th>
                    <th>Ref Date</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}

function generateRsiTable(stocks: RsiResult[]): string {
    const rows = stocks.map(s => {
        const isHighQuality = s.trend === 'OVERSOLD_IN_UPTREND';
        const rowStyle = isHighQuality ? 'background-color: #d4edda;' : ''; // Light green background
        const trendLabel = isHighQuality ? `<strong>${s.trend.replace(/_/g, ' ')} ⭐</strong>` : s.trend.replace(/_/g, ' ');

        return `
        <tr style="${rowStyle}">
            <td><b>${s.symbol}</b></td>
            <td>${s.currentPrice.toFixed(2)}</td>
            <td style="font-weight: bold; color: ${s.trend.startsWith('OVERSOLD') ? 'green' : 'red'};">${s.rsi.toFixed(2)}</td>
            <td>${trendLabel}</td>
        </tr>
    `}).join('');

    return `
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; border-color: #ddd;">
            <thead>
                <tr style="background-color: #f2f2f2;">
                    <th>Symbol</th>
                    <th>Price</th>
                    <th>RSI (14)</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}

function generateGcTable(stocks: GoldenCrossResult[]): string {
    const rows = stocks.map(s => {
        const rsiColor = s.rsi > 70 ? 'red' : 'green';
        return `
        <tr>
            <td><b>${s.symbol}</b></td>
            <td>${s.currentPrice.toFixed(2)}</td>
            <td style="font-weight: bold; color: ${rsiColor}">${s.rsi.toFixed(2)}</td>
            <td>${s.ma50.toFixed(2)}</td>
            <td>${s.ma200.toFixed(2)}</td>
            <td style="color: gold; font-weight: bold; background-color: #444;">GOLDEN CROSS</td>
        </tr>
    `}).join('');

    return `
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; border-color: #ddd;">
            <thead>
                <tr style="background-color: #f2f2f2;">
                    <th>Symbol</th>
                    <th>Price</th>
                    <th>RSI (14)</th>
                    <th>50 SMA</th>
                    <th>200 SMA</th>
                    <th>Signal</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}
