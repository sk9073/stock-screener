import YahooFinance from 'yahoo-finance2';
import { RSI } from 'technicalindicators';
import { NSE_500_TICKERS } from './tickers';

const yahooFinance = new YahooFinance();

export interface RsiResult {
    symbol: string;
    rsi: number;
    currentPrice: number;
    trend: 'OVERSOLD' | 'OVERBOUGHT' | 'NEUTRAL';
}

export interface GoldenCrossResult {
    symbol: string;
    ma50: number;
    ma200: number;
    currentPrice: number;
    trend: 'GOLDEN_CROSS' | 'DEATH_CROSS' | 'NEUTRAL';
}

/**
 * Strategy 1: RSI Reversion
 * Finds stocks with RSI(14) < 30 (Oversold) or RSI(14) > 70 (Overbought)
 */
export async function scanRsiStrategy(): Promise<RsiResult[]> {
    const tickers = NSE_500_TICKERS;
    const results: RsiResult[] = [];
    const CHUNK_SIZE = 5;

    console.log(`Scanning RSI for ${tickers.length} stocks...`);

    for (let i = 0; i < tickers.length; i += CHUNK_SIZE) {
        const chunk = tickers.slice(i, i + CHUNK_SIZE);
        
        await Promise.all(chunk.map(async (symbol) => {
            try {
                // Fetch last ~100 trading days for RSI calculation
                const queryOptions = {
                    period1: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000), 
                    period2: new Date(),
                    interval: '1d' as const
                };
                
                const data = await yahooFinance.historical(symbol, queryOptions) as any[];
                if (!data || data.length < 20) return;

                const closes = data.map(d => d.close);
                const inputRSI = {
                    values: closes,
                    period: 14
                };
                
                const rsiValues = RSI.calculate(inputRSI);
                const currentRSI = rsiValues[rsiValues.length - 1];
                const currentPrice = closes[closes.length - 1];

                if (currentRSI < 30) {
                    results.push({ symbol, rsi: currentRSI, currentPrice, trend: 'OVERSOLD' });
                } else if (currentRSI > 75) {
                    results.push({ symbol, rsi: currentRSI, currentPrice, trend: 'OVERBOUGHT' });
                }

            } catch (err) {
               // Silently fail or log debug
            }
        }));
        
        // Rate limiting
        await new Promise(r => setTimeout(r, 200));
    }
    return results;
}

/**
 * Strategy 2: Golden Cross
 * Finds stocks where 50 SMA crosses above 200 SMA
 */
export async function scanGoldenCrossStrategy(): Promise<GoldenCrossResult[]> {
    const tickers = NSE_500_TICKERS;
    const results: GoldenCrossResult[] = [];
    const CHUNK_SIZE = 5;

    console.log(`Scanning Golden Cross for ${tickers.length} stocks...`);

    for (let i = 0; i < tickers.length; i += CHUNK_SIZE) {
        const chunk = tickers.slice(i, i + CHUNK_SIZE);
        
        await Promise.all(chunk.map(async (symbol) => {
            try {
                // Need ~250 trading days for 200 SMA
                const queryOptions = {
                    period1: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000), 
                    period2: new Date(),
                    interval: '1d' as const
                };
                
                const data = await yahooFinance.historical(symbol, queryOptions) as any[];
                if (!data || data.length < 201) return;

                const closes = data.map(d => d.close);
                
                // Simple Moving Average Logic
                const ma50 = calculateSMA(closes, 50);
                const ma200 = calculateSMA(closes, 200);
                
                const prevMa50 = calculateSMA(closes.slice(0, -1), 50);
                const prevMa200 = calculateSMA(closes.slice(0, -1), 200);

                if (!ma50 || !ma200 || !prevMa50 || !prevMa200) return;

                // Golden Cross: 50 crosses ABOVE 200
                if (prevMa50 <= prevMa200 && ma50 > ma200) {
                     results.push({ 
                         symbol, 
                         ma50, 
                         ma200, 
                         currentPrice: closes[closes.length - 1], 
                         trend: 'GOLDEN_CROSS' 
                     });
                }
                
            } catch (err) {
                // Silently fail
            }
        }));
         await new Promise(r => setTimeout(r, 200));
    }
    return results;
}

function calculateSMA(data: number[], window: number): number | null {
    if (data.length < window) return null;
    const slice = data.slice(data.length - window);
    const sum = slice.reduce((a, b) => a + b, 0);
    return sum / window;
}
