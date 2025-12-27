import YahooFinance from 'yahoo-finance2';
import { NSE_500_TICKERS } from './tickers';

const yahooFinance = new YahooFinance();

export interface StockDropResult {
  symbol: string;
  currentPrice: number;
  referencePrice: number;
  dropPercentage: number;
  referenceDate: string;
}

/**
 * Scans the list of stocks to find those that have fallen below -6%
 * over the last 6 days from the current day.
 */
export async function findFallingStocks(): Promise<StockDropResult[]> {
  const tickers = NSE_500_TICKERS;
  const results: StockDropResult[] = [];
  const DAYS_LOOKBACK = 6;
  
  // We process in chunks to handle rate limiting and concurrency gracefully
  const CHUNK_SIZE = 5; 
  
  console.log(`Scanning ${tickers.length} stocks...`);

  for (let i = 0; i < tickers.length; i += CHUNK_SIZE) {
    const chunk = tickers.slice(i, i + CHUNK_SIZE);
    
    // Process chunk in parallel
    const chunkPromises = chunk.map(async (symbol) => {
      try {
        // Fetch historical data for the last ~10 days to be safe
        const queryOptions = {
          period1: new Date(Date.now() - (DAYS_LOOKBACK + 5) * 24 * 60 * 60 * 1000), // ~11 days ago
          period2: new Date(),
          interval: '1d' as const, 
        };
        const result = await yahooFinance.historical(symbol, queryOptions) as any[];

        if (!result || result.length < 2) {
            return null; // Not enough data
        }

        // Sort by date just in case
        const sortedData = result.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Get the latest available closing price (Today or Yesterday)
        const latestEntry = sortedData[sortedData.length - 1];
        
        // Calculate the target date (6 calendar days ago)
        const today = new Date();
        const targetDate = new Date(today.getTime() - DAYS_LOOKBACK * 24 * 60 * 60 * 1000);
        targetDate.setHours(0, 0, 0, 0);

        // Find the entry closest to the target date (but not after it ideally, or just the one 6 days ago)
        
        let referenceEntry = null;
        
        // Let's try to find an exact match or the closest previous trading day.
        for (let j = sortedData.length - 1; j >= 0; j--) {
            const entryDate = new Date(sortedData[j].date);
            
            if (entryDate <= targetDate) {
                referenceEntry = sortedData[j];
                break; // Found the closest one BEFORE or ON target date
            }
        }

        // If we didn't find a reference entry (e.g. IPO happened 2 days ago), skip
        if (!referenceEntry) return null;

        const currentPrice = latestEntry.close;
        const referencePrice = referenceEntry.close;
        
        const change = (currentPrice - referencePrice) / referencePrice;

        if (change <= -0.06) {
           return {
             symbol,
             currentPrice,
             referencePrice,
             dropPercentage: parseFloat((change * 100).toFixed(2)),
             referenceDate: referenceEntry.date.toISOString().split('T')[0]
           };
        }
      } catch (err) {
        console.error(`Error fetching ${symbol}:`, err instanceof Error ? err.message : err);
        return null;
      }
      return null;
    });

    const chunkResults = await Promise.all(chunkPromises);
    
    // Filter out nulls and add to results
    chunkResults.forEach(r => {
        if (r) results.push(r);
    });

    // Optional: Add a small delay between chunks to be polite to the API
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}
