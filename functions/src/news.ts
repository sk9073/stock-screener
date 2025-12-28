import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export interface StockNews {
    title: string;
    link: string;
    publisher: string;
    time: string;
}

export async function fetchStockNews(symbol: string): Promise<StockNews[]> {
    try {
        // Search usually returns relevant news for the symbol
        // For NSE stocks, yahoo finance symbols are like "RELIANCE.NS". 
        // Searching for "RELIANCE.NS" might return generic web results sometimes.
        // Let's rely on the direct symbol property if possible, or refine the query.
        
        const result = await yahooFinance.search(symbol, { newsCount: 5 });
        
        if (!result.news || result.news.length === 0) {
            return [];
        }

        return result.news
            .filter((item: any) => {
                // heuristic to filter out completely unrelated spam if needed
                // for now receiving *any* news is better than none
                return true; 
            })
            .slice(0, 3) // Take top 3
            .map((item: any) => ({
                title: item.title,
                link: item.link,
                publisher: item.publisher,
                time: new Date(item.providerPublishTime * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
            }));
    } catch (error) {
        console.error(`Error fetching news for ${symbol}:`, error);
        return [];
    }
}
